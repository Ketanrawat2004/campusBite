'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') });

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/ApiError');

const DEFAULT_JWT_SECRET = 'dev_fallback_campusbite_jwt_access_secret_key_2026_safe';

/**
 * Token Service
 * Manages JWT access tokens and refresh tokens.
 */

/**
 * Generate Access Token (short-lived, 15m)
 * @param {object} user - User document or safe user object
 * @returns {string} Signed JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    sub: user._id || user.id,
    role: user.role,
    collegeId: user.collegeId,
    email: user.email,
    canteenId: user.canteenProfile?.canteenId || user.canteenId || null,
  };

  const secret = process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_SECRET;

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
}

/**
 * Generate opaque Refresh Token (long-lived, 7d)
 * @returns {string} Random hex string
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Hash refresh token for secure database storage
 * @param {string} token
 * @returns {Promise<string>}
 */
async function hashRefreshToken(token) {
  return bcrypt.hash(token, 10);
}

/**
 * Compare plain refresh token against hashed token
 * @param {string} token
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function compareRefreshToken(token, hash) {
  return bcrypt.compare(token, hash);
}

/**
 * Generate a random verification/reset token
 * @returns {{ token: string, hash: string }}
 */
function generateOpaqueToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  generateOpaqueToken,
};
