'use strict';
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  category: {
    type: String,
    enum: ['WRONG_ORDER', 'FOOD_QUALITY', 'LATE_DELIVERY', 'PAYMENT_ISSUE', 'MISSING_ITEM', 'OTHER'],
    required: true,
  },
  status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  resolution: { type: String, maxlength: 1000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, { timestamps: true });

complaintSchema.index({ canteenId: 1, status: 1 });
complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
