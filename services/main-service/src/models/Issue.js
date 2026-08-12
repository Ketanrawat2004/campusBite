'use strict';

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  orderNumber: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true, index: true },
  issueType: { type: String, required: true }, // e.g. "Food Quality", "Missing Item", "Delivery Delay", "Other"
  studentMessage: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  staffReply: { type: String, default: '' },
  repliedAt: { type: Date },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
