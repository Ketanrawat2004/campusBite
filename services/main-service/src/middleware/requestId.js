'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique requestId to every request.
 * Used in logging to trace a request through the system.
 */
function requestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestId;
