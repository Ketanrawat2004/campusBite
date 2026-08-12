'use strict';

const authService = require('../services/auth/authService');
const asyncHandler = require('../utils/asyncHandler');

const REFRESH_COOKIE_NAME = 'campusbite_refresh';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  // Set httpOnly refresh cookie
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Welcome to CampusBite!',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  const result = await authService.refreshAccessToken(rawToken);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.verifyEmail(token);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/auth/forgot-password
 * Direct password reset — no email token, just verify email exists and set new password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.directResetPassword(req.body);
  res.json({ success: true, message: result.message });
});

/**
 * POST /api/v1/auth/google
 * Verify Google ID token and sign in or create account
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, role, email, name } = req.body;
  if (!idToken) throw require('../utils/ApiError').badRequest('Google ID token is required');

  const result = await authService.googleAuth({ idToken, role, email, name });

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Google sign-in successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  googleAuth,
};
