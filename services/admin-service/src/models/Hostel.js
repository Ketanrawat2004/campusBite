'use strict';
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blockName: { type: String, required: true },
  floors: { type: Number, default: 4 },
  roomsPerFloor: { type: Number, default: 20 },
}, { _id: false });

const hostelSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
  name: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, trim: true, uppercase: true },
  type: { type: String, enum: ['BOYS', 'GIRLS', 'MIXED'], required: true },
  blocks: [blockSchema],
  location: {
    lat: { type: Number },
    lng: { type: Number },
    description: { type: String },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);
