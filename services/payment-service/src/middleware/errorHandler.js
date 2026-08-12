'use strict';

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';

  // Joi validation errors from express-joi-validation
  if (err.isJoi || err.name === 'ValidationError' && err.details) {
    const details = err.details ? err.details.map((d) => ({
      field: d.context?.key || 'unknown',
      message: d.message.replace(/["']/g, ''),
    })) : [];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Invalid token' },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
    });
  }

  // Operational ApiError
  if (err instanceof ApiError && err.isOperational) {
    if (err.statusCode >= 500) {
      logger.error({ msg: err.message, requestId, err });
    } else {
      logger.warn({ msg: err.message, requestId, code: err.code });
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unknown / programming errors — never expose details
  logger.error({ msg: 'Unhandled error', requestId, err });
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

module.exports = errorHandler;
