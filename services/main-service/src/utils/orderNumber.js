'use strict';

const { format } = require('date-fns');

let dailyCounter = 0;
let lastDate = '';

/**
 * Generate a human-readable order number.
 * Format: CB-YYYYMMDD-XXXX (e.g., CB-20241015-0042)
 * NOTE: For production use, persist counter in Redis or MongoDB.
 * This in-memory counter resets on server restart (acceptable for dev).
 */
function generateOrderNumber() {
  const today = format(new Date(), 'yyyyMMdd');
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `CB-${today}-${seq}`;
}

/**
 * Generate a delivery batch number.
 * Format: CB-BATCH-YYYYMMDD-XXXX
 */
function generateBatchNumber() {
  const today = format(new Date(), 'yyyyMMdd');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `CB-BATCH-${today}-${seq}`;
}

module.exports = { generateOrderNumber, generateBatchNumber };
