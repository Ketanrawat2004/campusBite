// Server entry point - reloaded 2026-08-11 15:06
'use strict';

// Load env first, before any other imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { disconnectProducer } = require('./config/kafka');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 4000;

async function startServer() {
  try {
    // Connect to all infrastructure before accepting requests
    await connectDatabase();
    await connectRedis();
    // Kafka producer connects lazily on first publish

    const server = app.listen(PORT, () => {
      logger.info({
        msg: `CampusBite API started`,
        port: PORT,
        env: process.env.NODE_ENV,
        url: `http://localhost:${PORT}/api/v1`,
      });
    });

    // ─── Graceful shutdown ────────────────────────────────────
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

      // Force exit after 15 seconds
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
    logger.error({ msg: 'Failed to start server', err });
    process.exit(1);
  }
}

startServer();
