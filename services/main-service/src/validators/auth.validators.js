'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Full name is required',
  }),
  email: Joi.string().email().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.empty': 'Password is required',
  }),
  phone: Joi.string().allow('', null).optional(),
  collegeId: Joi.string().hex().length(24).allow('', null).optional(),
  studentProfile: Joi.object({
    rollNumber: Joi.string().trim().allow('', null).optional(),
    hostelId: Joi.string().hex().length(24).allow('', null).optional(),
    roomNumber: Joi.string().trim().allow('', null).optional(),
    year: Joi.number().integer().min(1).max(6).allow('', null).optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().allow('', null).optional(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
};
