'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'ORDER_UPDATE' },
    isRead: { type: Boolean, default: false },
    relatedEntity: {
      id: { type: mongoose.Schema.Types.ObjectId },
      type: { type: String, default: 'Order' },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
