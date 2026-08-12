'use strict';
const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  openTime: { type: String, default: '08:00' },
  closeTime: { type: String, default: '22:00' },
  isOpen: { type: Boolean, default: true },
}, { _id: false });

const canteenSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String },
  location: {
    name: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  operatingHours: [operatingHoursSchema],
  contactPhone: { type: String },
  avgPrepTimeMinutes: { type: Number, default: 15 },
  isCurrentlyOpen: { type: Boolean, default: false },
  acceptingOrders: { type: Boolean, default: false, index: true },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  tags: [{ type: String }],
  staffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Canteen', canteenSchema);
