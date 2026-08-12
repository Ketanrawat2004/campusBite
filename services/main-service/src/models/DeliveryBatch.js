'use strict';
const mongoose = require('mongoose');
const { DELIVERY_BATCH_STATUS } = require('../config/constants');

const deliveryBatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true, unique: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  orderCount: { type: Number, default: 0 },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryWindowStart: { type: Date },
  deliveryWindowEnd: { type: Date },
  status: {
    type: String,
    enum: Object.values(DELIVERY_BATCH_STATUS),
    default: DELIVERY_BATCH_STATUS.FORMING,
    index: true,
  },
  deliveryFeePerOrderInPaise: { type: Number, default: 0 },
  estimatedPickupAt: { type: Date },
  actualPickupAt: { type: Date },
  estimatedDeliveryAt: { type: Date },
  actualDeliveryAt: { type: Date },
  groupingMetadata: {
    groupingKey: { type: String },
    windowKey: { type: String },
    pricingTier: { type: String, enum: ['SOLO', 'SMALL', 'LARGE'] },
  },
}, { timestamps: true });

deliveryBatchSchema.index({ canteenId: 1, hostelId: 1, status: 1 });
deliveryBatchSchema.index({ deliveryPartnerId: 1, status: 1 });
deliveryBatchSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DeliveryBatch', deliveryBatchSchema);
