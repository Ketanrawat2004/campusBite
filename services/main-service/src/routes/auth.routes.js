'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const rateLimiter = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
} = require('../validators/auth.validators');

// Public routes with rate limiting
router.post(
  '/register',
  rateLimiter({ endpoint: 'register', max: 5, windowSecs: 300 }),
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  rateLimiter({ endpoint: 'login', max: 10, windowSecs: 60 }),
  validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validate(refreshSchema),
  authController.refresh
);

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  rateLimiter({ endpoint: 'forgot-password', max: 5, windowSecs: 300 }),
  authController.forgotPassword
);

router.post(
  '/google',
  rateLimiter({ endpoint: 'google-auth', max: 20, windowSecs: 60 }),
  authController.googleAuth
);

// Protected routes
router.post('/logout', authenticate, authController.logout);

module.exports = router;
