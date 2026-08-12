'use strict';
const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  usedAt: { type: Date, default: Date.now },
}, { timestamps: false });

couponUsageSchema.index({ couponId: 1, userId: 1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
