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

  // If no external REDIS_URL is provided, use ultra-fast In-Memory Redis Mock instantly (0ms latency, zero connection timeouts)
  if (!process.env.REDIS_URL) {
    redisClient = new InMemoryRedisMock();
    return redisClient;
  }

  const url = process.env.REDIS_URL;

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableReadyCheck: false,
      connectTimeout: 2000,
      retryStrategy: () => null, // Don't loop endlessly if missing
    });

    redisClient.on('error', (err) => {
      logger.debug({ msg: 'Redis error — fallback active', err: err.message });
      redisClient = new InMemoryRedisMock();
    });
  } catch (err) {
    redisClient = new InMemoryRedisMock();
  }

  return redisClient;
}

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    redisClient = new InMemoryRedisMock();
    logger.info({ msg: 'Using In-Memory Cache (0ms latency, zero network overhead)' });
    return redisClient;
  }

  const client = getRedisClient();
  if (client instanceof InMemoryRedisMock) return client;

  try {
    await client.connect();
    logger.info({ msg: 'Redis connected' });
    return client;
  } catch (err) {
    logger.info({ msg: 'Activated In-Memory Redis Cache Fallback (Zero external Redis dependency needed)' });
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
