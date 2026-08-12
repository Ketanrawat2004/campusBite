'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { disconnectProducer } = require('./config/kafka');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 4002;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info({
        msg: `CampusBite Admin Service started`,
        port: PORT,
        env: process.env.NODE_ENV,
        url: `http://localhost:${PORT}/api/v1`,
      });
    });

    async function shutdown(signal) {
      logger.info({ msg: `${signal} received. Shutting down gracefully...` });
      server.close(async () => {
        try {
          await disconnectProducer();
          await disconnectRedis();
          await disconnectDatabase();
          logger.info({ msg: 'Graceful shutdown complete' });
          process.exit(0);
        } catch (err) {
          logger.error({ msg: 'Error during shutdown', err });
          process.exit(1);
        }
      });
      setTimeout(() => {
        logger.error({ msg: 'Forced shutdown after timeout' });
        process.exit(1);
      }, 15000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ msg: 'Unhandled promise rejection', reason });
    });
    process.on('uncaughtException', (err) => {
      logger.error({ msg: 'Uncaught exception', err });
      process.exit(1);
    });

    return server;
  } catch (err) {
    logger.error({ msg: 'Failed to start admin service', err });
    process.exit(1);
  }
}

startServer();
