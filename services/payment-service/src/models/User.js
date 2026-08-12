'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus' },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  googleId: { type: String, sparse: true, index: true }, // Google OAuth ID
  avatarUrl: { type: String },                           // Google profile picture
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
    default: USER_ROLES.STUDENT,
    index: true,
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshTokenHash: { type: String, select: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  // Role-specific profiles
  studentProfile: {
    rollNumber: { type: String, trim: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
    roomNumber: { type: String, trim: true },
    year: { type: Number, min: 1, max: 6 },
  },
  canteenProfile: {
    canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen' },
  },
  deliveryProfile: {
    isAvailable: { type: Boolean, default: false },
    vehicleType: { type: String, enum: ['BICYCLE', 'MOTORCYCLE', 'ON_FOOT'], default: 'ON_FOOT' },
    activeDeliveryBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBatch' },
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never return sensitive fields in toJSON
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
