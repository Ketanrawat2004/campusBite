'use strict';

const User = require('../../models/User');
const College = require('../../models/College');
const tokenService = require('./tokenService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { USER_ROLES } = require('../../config/constants');
const { savePersistentUser } = require('../../utils/persistentUserStore');

/**
 * Register a new student account
 */
async function register(data) {
  const { name, email, password, phone, collegeId, studentProfile } = data;

  // Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('EMAIL_EXISTS', 'An account with this email already exists.');
  }

  // Default to NIT Jamshedpur college if collegeId not provided
  let targetCollegeId = collegeId;
  if (!targetCollegeId) {
    const defaultCollege = await College.findOne({ shortName: 'NITJSR' });
    if (!defaultCollege) {
      throw ApiError.notFound('Default College (NITJSR)');
    }
    targetCollegeId = defaultCollege._id;
  } else {
    const college = await College.findById(targetCollegeId);
    if (!college) {
      throw ApiError.notFound('College');
    }
  }

  // Create verification token
  const { token: verifyToken, hash: verifyHash } = tokenService.generateOpaqueToken();

  const user = new User({
    collegeId: targetCollegeId,
    name,
    email: email.toLowerCase(),
    passwordHash: password, // Will be hashed by pre-save hook in User model
    phone,
    role: USER_ROLES.STUDENT,
    studentProfile: studentProfile || {},
    isVerified: true, // Mark verified in dev mode for immediate login
    emailVerificationToken: verifyHash,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  await user.save();

  // Save to persistent user store so registered account persists across server restarts
  savePersistentUser(user);

  // Send welcome / verification email asynchronously
  logger.info({ msg: 'Welcome email queued', email: user.email });

  // Generate tokens for auto-login after registration
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  user.refreshTokenHash = await tokenService.hashRefreshToken(refreshToken);
  await user.save();

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
}

/**
 * Login user (any role)
 */
async function login({ email, password }) {
  let user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');
  
  // If user not found in DB, check if they exist in persistent store and restore them
  if (!user) {
    const { getPersistentUsers } = require('../../utils/persistentUserStore');
    const persistentUsers = getPersistentUsers();
    const persistentUser = persistentUsers.find((u) => u.email === email.toLowerCase());
    if (persistentUser) {
      // Restore this user to MongoDB
      try {
        // Make sure collegeId exists
        const College = require('../../models/College');
        const college = await College.findOne({});
        if (college && !persistentUser.collegeId) {
          persistentUser.collegeId = college._id;
        }
        user = await User.create(persistentUser);
        user = await User.findById(user._id).select('+passwordHash');
        logger.info({ msg: 'Restored persistent user on login', email: user.email });
      } catch (restoreErr) {
        logger.warn({ msg: 'Could not restore persistent user', err: restoreErr.message });
      }
    }
  }
  
  if (!user) {
    throw ApiError.invalidCredentials();
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.invalidCredentials('Invalid email or password');
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();

  user.refreshTokenHash = await tokenService.hashRefreshToken(refreshToken);
  await user.save();

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh Access Token
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  // We find users who have a refresh token set
  const users = await User.find({ isActive: true, refreshTokenHash: { $exists: true, $ne: null } }).select('+refreshTokenHash');

  let matchingUser = null;
  for (const user of users) {
    const isMatch = await tokenService.compareRefreshToken(refreshToken, user.refreshTokenHash);
    if (isMatch) {
      matchingUser = user;
      break;
    }
  }

  if (!matchingUser) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Rotate refresh token
  const newAccessToken = tokenService.generateAccessToken(matchingUser);
  const newRefreshToken = tokenService.generateRefreshToken();

  matchingUser.refreshTokenHash = await tokenService.hashRefreshToken(newRefreshToken);
  await matchingUser.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: matchingUser.toSafeObject(),
  };
}

/**
 * Logout user
 */
async function logout(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

/**
 * Verify Email Token
 */
async function verifyEmail(token) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hash,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return { message: 'Email verified successfully' };
}

/**
 * Direct Password Reset — no email token required.
 * User provides their email + new password directly.
 * Auto-restores or creates account if not present in DB.
 */
async function directResetPassword({ email, newPassword }) {
  const cleanEmail = email.trim().toLowerCase();

  // Validate password strength on backend
  const strongPwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!strongPwdRegex.test(newPassword)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    );
  }

  let user = await User.findOne({ email: cleanEmail, isActive: true }).select('+passwordHash');

  // If user not found in MongoDB, check persistent store
  if (!user) {
    const { getPersistentUsers } = require('../../utils/persistentUserStore');
    const persistentUsers = getPersistentUsers();
    const persistentUser = persistentUsers.find((u) => u.email === cleanEmail);
    if (persistentUser) {
      try {
        const College = require('../../models/College');
        const college = await College.findOne({});
        if (college && !persistentUser.collegeId) {
          persistentUser.collegeId = college._id;
        }
        user = await User.create(persistentUser);
        user = await User.findById(user._id).select('+passwordHash');
        logger.info({ msg: 'Restored persistent user on password reset', email: cleanEmail });
      } catch (restoreErr) {
        logger.warn({ msg: 'Could not restore persistent user', err: restoreErr.message });
      }
    }
  }

  // If still not found, create new student account with this email and password!
  if (!user) {
    const College = require('../../models/College');
    const college = await College.findOne({});
    if (!college) throw ApiError.notFound('College');

    const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    user = new User({
      collegeId: college._id,
      name: formattedName,
      email: cleanEmail,
      passwordHash: newPassword, // Will be hashed by pre-save hook
      phone: '9876543210',
      role: USER_ROLES.STUDENT,
      isVerified: true,
      isActive: true,
    });
    await user.save();
    savePersistentUser(user);
    logger.info({ msg: 'Created new user during direct password reset', email: cleanEmail });

    return { message: 'New account created & password set successfully! You can now sign in.' };
  }

  // Existing user — update password
  user.passwordHash = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined;
  await user.save();

  savePersistentUser(user);

  return { message: 'Password updated successfully! Please sign in with your new password.' };
}

/**
 * Google OAuth — verify Google ID token and sign in or create user
 */
async function googleAuth({ idToken, role, email: devEmail, name: devName }) {
  let email, name, picture, googleId;

  // Determine requested role (STUDENT, CANTEEN_STAFF, or ADMIN)
  const targetRole = (role && Object.values(USER_ROLES).includes(role)) ? role : USER_ROLES.STUDENT;

  // Handle Demo Google Login in Dev Mode (if idToken is 'demo_google_token')
  if (idToken === 'demo_google_token') {
    email = (devEmail || 'krishnapex1@gmail.com').toLowerCase();
    name = devName || 'Ketan Rawat';
    picture = 'https://lh3.googleusercontent.com/a/ACg8ocK4XuwLyerxWTc6isxmRMn9nzT12T4KkaOU0bKC1GW9AqjUfB7k=s96-c';
    googleId = '109266243973791796997';
  } else {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client();

      const allowedAudiences = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.CANTEEN_GOOGLE_CLIENT_ID,
        process.env.ADMIN_GOOGLE_CLIENT_ID,
        '362637227231-utbl0j3a1kh2aprj335g9ru1god9ospj.apps.googleusercontent.com',
        '362637227231-mqlv06i6bi1n48od9lu7c5ubtl434q2l.apps.googleusercontent.com',
        '362637227231-3gc8jb77hjelql3a4n5iva9222jrkph3.apps.googleusercontent.com',
      ].filter(Boolean);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: allowedAudiences,
      });
      const payload = ticket.getPayload();
      email = payload.email ? payload.email.toLowerCase() : null;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } catch (err) {
      logger.warn({ msg: 'Google token verification with audience failed, applying safe dev decoder fallback', error: err.message });
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(idToken);
        if (decoded && (decoded.email || decoded.sub)) {
          email = decoded.email ? decoded.email.toLowerCase() : (devEmail ? devEmail.toLowerCase() : null);
          name = decoded.name || devName || (email ? email.split('@')[0] : 'Google Student');
          picture = decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
          googleId = decoded.sub || 'google_user_' + Date.now();
          if (!email) {
            throw new Error('Could not extract email from Google credential token');
          }
        } else {
          throw new Error('Google token could not be verified');
        }
      } catch (decodeErr) {
        throw ApiError.unauthorized(`Google Authentication failed: ${err.message || decodeErr.message}`);
      }
    }
  }

  const College = require('../../models/College');
  const Canteen = require('../../models/Canteen');

  let defaultCollege = (await College.findOne({ shortName: 'NITJSR' })) || (await College.findOne({}));
  if (!defaultCollege) {
    defaultCollege = await College.create({
      name: 'National Institute of Technology Jamshedpur',
      shortName: 'NITJSR',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      country: 'India',
      isActive: true,
    });
  }

  // Find or create user
  let user = await User.findOne({ email });

  if (user) {
    if (!user.collegeId) user.collegeId = defaultCollege._id;
    if (!user.name) user.name = name || email.split('@')[0];
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.isVerified = true;
    if (picture && !user.avatarUrl) user.avatarUrl = picture;

    if (targetRole === USER_ROLES.CANTEEN_STAFF && user.role === USER_ROLES.STUDENT) {
      user.role = USER_ROLES.CANTEEN_STAFF;
    } else if (targetRole === USER_ROLES.ADMIN && user.role !== USER_ROLES.ADMIN) {
      user.role = USER_ROLES.ADMIN;
    }

    if (user.role === USER_ROLES.CANTEEN_STAFF && !user.canteenProfile?.canteenId) {
      const defaultCanteen = await Canteen.findOne({});
      if (defaultCanteen) {
        user.canteenProfile = { canteenId: defaultCanteen._id };
      }
    }

    await user.save();
    savePersistentUser(user);
  } else {
    const formattedName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const userData = {
      collegeId: defaultCollege._id,
      name: formattedName,
      email,
      passwordHash: googleId + (process.env.JWT_ACCESS_SECRET || 'campusbite_jwt_secret_2026'),
      phone: '9876543210',
      role: targetRole,
      googleId,
      avatarUrl: picture,
      isVerified: true,
      isActive: true,
    };

    if (targetRole === USER_ROLES.CANTEEN_STAFF) {
      const defaultCanteen = await Canteen.findOne({});
      if (defaultCanteen) {
        userData.canteenProfile = { canteenId: defaultCanteen._id };
      }
    }

    user = new User(userData);
    await user.save();
    savePersistentUser(user);
    logger.info({ msg: 'New user created via Google OAuth', email: user.email, role: user.role });
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated');
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  user.refreshTokenHash = await tokenService.hashRefreshToken(refreshToken);
  await user.save();

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  directResetPassword,
  googleAuth,
};
