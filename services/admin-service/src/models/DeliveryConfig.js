'use strict';
const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
  minOrders: { type: Number, required: true },
  maxOrders: { type: Number, required: true },
  feeInPaise: { type: Number, required: true },
  label: { type: String, required: true, enum: ['SOLO', 'SMALL', 'LARGE'] },
}, { _id: false });

const deliveryConfigSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, unique: true },
  tiers: {
    type: [tierSchema],
    default: [
      { minOrders: 1, maxOrders: 1, feeInPaise: 2000, label: 'SOLO' },
      { minOrders: 2, maxOrders: 3, feeInPaise: 1500, label: 'SMALL' },
      { minOrders: 4, maxOrders: 99, feeInPaise: 1000, label: 'LARGE' },
    ],
  },
  maxBatchSize: { type: Number, default: 8 },
  groupingWindowMinutes: { type: Number, default: 15 },
  maxWaitMinutes: { type: Number, default: 20 },
}, { timestamps: true });

module.exports = mongoose.model('DeliveryConfig', deliveryConfigSchema);
