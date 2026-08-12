'use strict';
const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true, index: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

menuCategorySchema.index({ canteenId: 1, sortOrder: 1 });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
