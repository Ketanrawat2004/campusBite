'use strict';
const mongoose = require('mongoose');

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  additionalPriceInPaise: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const customizationGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  required: { type: Boolean, default: false },
  multiSelect: { type: Boolean, default: false },
  options: [customizationOptionSchema],
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String },
  priceInPaise: { type: Number, required: true, min: 0 },
  originalPriceInPaise: { type: Number, min: 0 },
  isVeg: { type: Boolean, required: true, default: true },
  isAvailable: { type: Boolean, default: true },
  preparationTimeMinutes: { type: Number, default: 10 },
  customizations: [customizationGroupSchema],
  tags: [{ type: String }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  totalOrderCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

menuItemSchema.index({ canteenId: 1 });
menuItemSchema.index({ canteenId: 1, categoryId: 1 });
menuItemSchema.index({ canteenId: 1, isAvailable: 1, isActive: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
