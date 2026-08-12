'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_fallback_campusbite_jwt_access_secret_key_2026_safe';

/**
 * Verifies JWT access token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token || token === 'null' || token === 'undefined') {
    // Fallback to active student in local dev mode
    const defaultUser = await User.findOne({ role: 'STUDENT' });
    if (defaultUser && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: defaultUser._id,
        role: defaultUser.role,
        collegeId: defaultUser.collegeId,
        canteenId: defaultUser.canteenId,
        email: defaultUser.email,
      };
      return next();
    }
    throw ApiError.unauthorized('No access token provided');
  }

  try {
    const decoded = jwt.verify(token, DEFAULT_JWT_SECRET);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      collegeId: decoded.collegeId,
      canteenId: decoded.canteenId,
      email: decoded.email,
    };
    next();
  } catch (err) {
    // Fallback to active student in local dev mode if token expired
    const defaultUser = await User.findOne({ role: 'STUDENT' });
    if (defaultUser && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: defaultUser._id,
        role: defaultUser.role,
        collegeId: defaultUser.collegeId,
        canteenId: defaultUser.canteenId,
        email: defaultUser.email,
      };
      return next();
    }
    if (err.name === 'TokenExpiredError') {
      throw ApiError.tokenExpired();
    }
    throw ApiError.tokenInvalid();
  }
});

module.exports = authenticate;
