'use strict';

const User = require('../models/User');
const College = require('../models/College');
const Campus = require('../models/Campus');
const Hostel = require('../models/Hostel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { deletePersistentUser } = require('../utils/persistentUserStore');

/**
 * GET /api/v1/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('collegeId', 'name shortName')
    .populate('campusId', 'name')
    .populate('studentProfile.hostelId', 'name shortCode type');

  if (!user) {
    throw ApiError.notFound('User');
  }

  res.json({
    success: true,
    data: user.toSafeObject(),
  });
});

/**
 * PATCH /api/v1/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user.toSafeObject(),
  });
});

/**
 * PATCH /api/v1/profile/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current and new password are required');
  }
  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long');
  }

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) {
    throw ApiError.notFound('User');
  }

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.passwordHash = newPassword; // Will be hashed by pre-save hook
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * PATCH /api/v1/profile/hostel
 */
const updateHostelDetails = asyncHandler(async (req, res) => {
  const { hostelId, roomNumber, rollNumber, year } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User');

  if (!user.studentProfile) user.studentProfile = {};

  if (hostelId) user.studentProfile.hostelId = hostelId;
  if (roomNumber) user.studentProfile.roomNumber = roomNumber;
  if (rollNumber) user.studentProfile.rollNumber = rollNumber;
  if (year) user.studentProfile.year = parseInt(year, 10);

  await user.save();

  res.json({
    success: true,
    message: 'Hostel details updated successfully',
    data: user.toSafeObject(),
  });
});

/**
 * DELETE /api/v1/profile
 * Completely and permanently deletes user account, email, password, and profile data.
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  const email = user.email;
  await User.findByIdAndDelete(userId);
  deletePersistentUser(email);

  res.json({
    success: true,
    message: 'Account and personal profile data permanently deleted from database',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateHostelDetails,
  deleteAccount,
};
