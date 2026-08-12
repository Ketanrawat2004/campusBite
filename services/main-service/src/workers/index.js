'use strict';

// Worker process entrypoint — runs Kafka consumers and background timers
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectDatabase } = require('../config/database');
const { connectRedis } = require('../config/redis');

const logger = require('../utils/logger');

const orderWorker = require('./orderWorker');
const groupingWorker = require('./groupingWorker');

async function startWorker() {
  logger.info({ msg: 'CampusBite Worker starting...' });

  try {
    await connectDatabase();
    await connectRedis();


    // Start background workers
    await Promise.all([
      groupingWorker.start(),
      orderWorker.start().catch((err) => logger.warn({ msg: 'Order worker deferred', err: err.message })),
    ]);

    logger.info({ msg: 'CampusBite Background Worker fully operational' });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    logger.error({ msg: 'Worker failed to start', err });
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info({ msg: 'Worker shutting down...' });
  process.exit(0);
}

startWorker();
