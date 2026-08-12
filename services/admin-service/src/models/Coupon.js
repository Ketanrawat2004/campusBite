'use strict';
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValueInPaise: { type: Number, default: 0 },
  maxDiscountInPaise: { type: Number },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimitTotal: { type: Number },
  usageLimitPerUser: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  applicableCanteenIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Canteen' }],
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

couponSchema.index({ collegeId: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
