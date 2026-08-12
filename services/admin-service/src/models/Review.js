'use strict';
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  itemRatings: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 300 },
    _id: false,
  }],
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

reviewSchema.index({ canteenId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
