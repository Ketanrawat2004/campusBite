'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbite';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    logger.info({ msg: 'MongoDB connected (admin-service)', uri: uri.replace(/:[^:@]*@/, ':***@') });
  } catch (err) {
    logger.error({ msg: 'MongoDB connection failed', err: err.message });
    throw err;
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
  isConnected = false;
  logger.info({ msg: 'MongoDB disconnected gracefully' });
}

module.exports = { connectDatabase, disconnectDatabase };
