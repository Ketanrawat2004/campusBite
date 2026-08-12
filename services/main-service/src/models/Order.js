'use strict';
const mongoose = require('mongoose');
const { ORDER_STATUS, FULFILLMENT_TYPE } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String },
  priceInPaise: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  customizations: [{
    groupName: { type: String },
    selectedOption: { type: String },
    additionalPriceInPaise: { type: Number, default: 0 },
    _id: false,
  }],
  itemTotalInPaise: { type: Number, required: true },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  note: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentEmail: { type: String, lowercase: true, trim: true },
  studentPhone: { type: String, trim: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  items: { type: [orderItemSchema], required: true },
  fulfillmentType: { type: String, enum: Object.values(FULFILLMENT_TYPE), required: true },
  deliveryDetails: {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
    hostelName: { type: String },
    blockName: { type: String },
    roomNumber: { type: String },
    requestedDeliveryWindow: {
      startTime: { type: Date },
      endTime: { type: Date },
    },
  },
  pricingBreakdown: {
    subtotalInPaise: { type: Number, required: true },
    deliveryFeeInPaise: { type: Number, default: 0 },
    discountInPaise: { type: Number, default: 0 },
    taxInPaise: { type: Number, default: 0 },
    totalInPaise: { type: Number, required: true },
  },
  couponCode: { type: String },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING_PAYMENT,
    index: true,
  },
  statusHistory: [statusHistorySchema],
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  deliveryBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBatch', index: true },
  cancellationReason: { type: String },
  rejectionReason: { type: String },
  estimatedReadyAt: { type: Date },
  actualReadyAt: { type: Date },
  estimatedDeliveryAt: { type: Date },
  actualDeliveryAt: { type: Date },
  specialInstructions: { type: String, maxlength: 300 },
  isRated: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.index({ studentId: 1, createdAt: -1 });
orderSchema.index({ canteenId: 1, status: 1 });
orderSchema.index({ canteenId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ collegeId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
