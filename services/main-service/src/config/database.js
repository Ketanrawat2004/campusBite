'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;
let memoryServer = null;

async function connectDatabase() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbite';

  try {
    // 1. Try connecting to configured MongoDB (5s timeout to support Cloud Atlas connections)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info({ msg: 'MongoDB connected', uri: uri.replace(/:[^:@]*@/, ':***@') });
  } catch (err) {
    logger.warn({
      msg: 'Local MongoDB service not running on port 27017. Initializing embedded MongoMemoryServer...',
      err: err.message,
    });

    try {
      // 2. Fallback to MongoMemoryServer for standalone zero-config dev environment
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'campusbite' },
      });
      const memUri = memoryServer.getUri();

      await mongoose.connect(memUri);
      isConnected = true;
      logger.info({ msg: 'Embedded In-Memory MongoDB Server started', uri: memUri });

      // 3. Auto-seed the memory database so pre-seeded accounts (rahul@nitjsr.ac.in, etc.) exist
      const seedScript = require('../../scripts/seedDataAuto');
      await seedScript();
      logger.info({ msg: 'Embedded MongoDB seeded successfully with NIT Jamshedpur data!' });
    } catch (memErr) {
      logger.error({ msg: 'Failed to start embedded MongoMemoryServer', err: memErr.message });
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error({ msg: 'MongoDB connection error', err: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn({ msg: 'MongoDB disconnected' });
  });
}

async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
  isConnected = false;
  logger.info({ msg: 'MongoDB disconnected gracefully' });
}

module.exports = { connectDatabase, disconnectDatabase };
