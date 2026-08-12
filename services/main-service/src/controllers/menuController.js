'use strict';

const menuService = require('../services/canteen/menuService');
const asyncHandler = require('../utils/asyncHandler');

const searchMenuItems = asyncHandler(async (req, res) => {
  const items = await menuService.searchMenuItems({
    query: req.query.q || req.query.query,
    isVeg: req.query.isVeg,
    canteenId: req.query.canteenId,
  });
  res.json({
    success: true,
    data: items,
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await menuService.createCategory({
    ...req.body,
    canteenId: req.params.id,
    collegeId: req.user.collegeId,
  });
  res.status(201).json({
    success: true,
    data: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await menuService.updateCategory(req.params.id, req.body);
  res.json({
    success: true,
    data: category,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const result = await menuService.deleteCategory(req.params.id);
  res.json({
    success: true,
    message: result.message,
  });
});

const createMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.createMenuItem({
    ...req.body,
    canteenId: req.params.id,
    collegeId: req.user.collegeId,
  });
  res.status(201).json({
    success: true,
    data: item,
  });
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.updateMenuItem(req.params.id, req.body);
  res.json({
    success: true,
    data: item,
  });
});

const toggleItemAvailability = asyncHandler(async (req, res) => {
  const item = await menuService.toggleItemAvailability(req.params.id, req.body.isAvailable);
  res.json({
    success: true,
    message: `Menu item is now ${item.isAvailable ? 'available' : 'unavailable'}`,
    data: item,
  });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const result = await menuService.deleteMenuItem(req.params.id);
  res.json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  searchMenuItems,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
};
