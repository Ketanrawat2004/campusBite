'use strict';
const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

const refundSchema = new mongoose.Schema({
  refundId: { type: String },
  amountInPaise: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amountInPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    index: true,
  },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String, select: false },
  paymentMethod: { type: String },
  paymentGateway: { type: String, default: 'razorpay' },
  verifiedAt: { type: Date },
  failureReason: { type: String },
  refunds: [refundSchema],
  webhookPayload: { type: mongoose.Schema.Types.Mixed, select: false },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
