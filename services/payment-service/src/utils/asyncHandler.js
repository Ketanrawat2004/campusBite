'use strict';

/**
 * Wraps an async Express route handler and forwards errors to next().
 * Eliminates try-catch boilerplate in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
