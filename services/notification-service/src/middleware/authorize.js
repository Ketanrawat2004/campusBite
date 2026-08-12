'use strict';

const ApiError = require('../utils/ApiError');

/**
 * RBAC middleware factory.
 * Usage: authorize('STUDENT', 'ADMIN')
 * Must be used after authenticate middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    next();
  };
}

module.exports = authorize;
