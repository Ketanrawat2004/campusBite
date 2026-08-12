'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

// In-Memory Redis Mock Fallback when real Redis server is not running locally
class InMemoryRedisMock {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key, val, mode, ttl) {
    if (mode === 'NX' && this.store.has(key)) {
      return null; // Key exists, NX check fails
    }
    this.store.set(key, String(val));
    if (ttl) {
      this.ttls.set(key, Date.now() + parseInt(ttl, 10) * 1000);
    }
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async incr(key) {
    const current = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, String(current));
    return current;
  }

  async expire(key, secs) {
    this.ttls.set(key, Date.now() + parseInt(secs, 10) * 1000);
    return 1;
  }

  async quit() {
    this.store.clear();
    this.ttls.clear();
  }

  on() {
    return this;
  }
}

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableReadyCheck: false,
    retryStrategy: () => null, // Don't loop endlessly if missing
  });

  redisClient.on('error', (err) => {
    logger.warn({ msg: 'Redis offline — using in-memory Redis fallback', err: err.message });
  });

  return redisClient;
}

async function connectRedis() {
  const client = getRedisClient();
  try {
    await client.connect();
    logger.info({ msg: 'Redis connected' });
    return client;
  } catch (err) {
    logger.warn({ msg: 'Real Redis unavailable. Activated In-Memory Redis Fallback.', err: err.message });
    redisClient = new InMemoryRedisMock();
    return redisClient;
  }
}

async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
    redisClient = null;
    logger.info({ msg: 'Redis disconnected gracefully' });
  }
}

module.exports = { getRedisClient, connectRedis, disconnectRedis };
