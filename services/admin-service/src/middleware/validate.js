'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Joi validation middleware factory.
 * Usage: validate(schema) — validates req.body by default.
 * Usage: validate(schema, 'query') — validates req.query.
 * Usage: validate(schema, 'params') — validates req.params.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.context?.key || d.path.join('.'),
        message: d.message.replace(/["']/g, ''),
      }));
      return next(ApiError.validationError(details));
    }

    req[source] = value; // replace with sanitized value
    next();
  };
}

module.exports = validate;
