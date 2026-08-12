'use strict';

class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static invalidCredentials() {
    return new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  static tokenExpired() {
    return new ApiError(401, 'TOKEN_EXPIRED', 'Access token has expired');
  }

  static tokenInvalid() {
    return new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid');
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, 'UNAUTHORIZED', message);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }

  static validationError(details) {
    return new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  static rateLimited() {
    return new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static invalidStatusTransition(from, to) {
    return new ApiError(
      400,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition order from '${from}' to '${to}'`
    );
  }
}

module.exports = ApiError;
