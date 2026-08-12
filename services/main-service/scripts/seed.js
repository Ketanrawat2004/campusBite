'use strict';

/**
 * CampusBite — Seed Data Script
 * Run with: npm run seed
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const seedDataAuto = require('./seedDataAuto');

async function seed() {
  console.log('\n🌱 Connecting to Database...');
  await connectDatabase();
  await seedDataAuto();
  console.log('\n🎉 Database seeded successfully with NIT Jamshedpur hostels, canteens, and menu items!\n');
  await disconnectDatabase();
  console.log('✅ Connection closed.\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
