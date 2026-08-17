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

    // Ensure database contains initial seed data and default admin/canteen accounts
    await ensureSeedData();
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

/**
 * Ensures seed data and required default administrative accounts exist in the connected MongoDB.
 */
async function ensureSeedData() {
  try {
    const User = require('../models/User');
    const College = require('../models/College');
    const Campus = require('../models/Campus');

    const collegeCount = await College.countDocuments();
    const userCount = await User.countDocuments();

    if (collegeCount === 0 || userCount === 0) {
      logger.info({ msg: 'Database has 0 colleges/users. Auto-seeding full NIT Jamshedpur dataset...' });
      const seedScript = require('../../scripts/seedDataAuto');
      await seedScript();
      logger.info({ msg: 'Database seeded successfully with NIT Jamshedpur hostels, canteens, and default accounts!' });
      return;
    }

    let college = await College.findOne({});
    let campus = await Campus.findOne({});

    // Ensure Admin Accounts
    const adminAccounts = [
      { email: 'admin@campusbite.dev', name: 'CampusBite Admin', phone: '9000000001' },
      { email: 'admin@nitjsr.ac.in', name: 'CampusBite Admin (NITJSR)', phone: '9000000002' },
    ];

    for (const admin of adminAccounts) {
      const existing = await User.findOne({ email: admin.email });
      if (!existing) {
        await User.create({
          collegeId: college ? college._id : undefined,
          campusId: campus ? campus._id : undefined,
          name: admin.name,
          email: admin.email,
          passwordHash: 'Admin@123',
          phone: admin.phone,
          role: 'ADMIN',
          isVerified: true,
          isActive: true,
        });
        logger.info({ msg: `Created missing default admin account: ${admin.email}` });
      }
    }

    // Ensure Canteen Staff Account
    const staffAccounts = [
      { email: 'main.canteen@nitjsr.ac.in', name: 'Main Canteen Manager', phone: '9000000010' },
      { email: 'amba.canteen@nitjsr.ac.in', name: 'Amba Canteen Manager', phone: '9000000011' },
    ];

    for (const staff of staffAccounts) {
      const existing = await User.findOne({ email: staff.email });
      if (!existing) {
        await User.create({
          collegeId: college ? college._id : undefined,
          campusId: campus ? campus._id : undefined,
          name: staff.name,
          email: staff.email,
          passwordHash: 'Staff@123',
          phone: staff.phone,
          role: 'CANTEEN_STAFF',
          isVerified: true,
          isActive: true,
        });
        logger.info({ msg: `Created missing default canteen staff account: ${staff.email}` });
      }
    }
  } catch (err) {
    logger.warn({ msg: 'ensureSeedData non-critical warning:', err: err.message });
  }
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
