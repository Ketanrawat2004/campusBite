'use strict';

const canteenService = require('../services/canteen/canteenService');
const Hostel = require('../models/Hostel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getHostels = asyncHandler(async (req, res) => {
  const hostels = await canteenService.getHostels(req.query);
  res.json({
    success: true,
    data: hostels,
  });
});

const getHostelById = asyncHandler(async (req, res) => {
  const hostel = await canteenService.getHostelById(req.params.id);
  res.json({
    success: true,
    data: hostel,
  });
});

const createHostel = asyncHandler(async (req, res) => {
  const hostel = new Hostel(req.body);
  await hostel.save();
  res.status(201).json({
    success: true,
    data: hostel,
  });
});

const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hostel) throw ApiError.notFound('Hostel');
  res.json({
    success: true,
    data: hostel,
  });
});

module.exports = {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
};
