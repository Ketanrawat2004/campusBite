'use strict';

const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Redis-backed rate limiter middleware factory.
 *
 * Why Redis?
 * In-memory rate limiters don't work across multiple server instances.
 * Redis provides a shared counter that works correctly even with 10 API replicas.
 *
 * @param {object} options
 * @param {string} options.endpoint - Endpoint label for Redis key
 * @param {number} options.max - Max requests per window
 * @param {number} options.windowSecs - Window duration in seconds
 * @param {boolean} options.useUserId - Use userId instead of IP (for auth'd routes)
 */
function rateLimiter(options = {}) {
  const { endpoint = 'default', max = 100, windowSecs = 60, useUserId = false } = options;

  return async (req, res, next) => {
    try {
      const redis = getRedisClient();
      const identifier = useUserId && req.user?.id ? req.user.id : req.ip;
      const key = REDIS_KEYS.rateLimit(endpoint, identifier);

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSecs);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

      if (count > max) {
        logger.warn({ msg: 'Rate limit exceeded', endpoint, identifier });
        return next(ApiError.rateLimited());
      }

      next();
    } catch (err) {
      // If Redis fails, don't block the request — log and continue
      logger.error({ msg: 'Rate limiter Redis error', err: err.message });
      next();
    }
  };
}

module.exports = rateLimiter;
