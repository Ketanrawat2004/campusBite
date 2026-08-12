'use strict';

const canteenService = require('../services/canteen/canteenService');
const menuService = require('../services/canteen/menuService');
const asyncHandler = require('../utils/asyncHandler');

const getCanteens = asyncHandler(async (req, res) => {
  const result = await canteenService.getCanteens(req.query);
  res.json({
    success: true,
    data: result.canteens,
    meta: result.meta,
  });
});

const getCanteenById = asyncHandler(async (req, res) => {
  const canteen = await canteenService.getCanteenById(req.params.id);
  res.json({
    success: true,
    data: canteen,
  });
});

const getCanteenMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.getCanteenMenu(req.params.id);
  res.json({
    success: true,
    data: menu,
  });
});

const createCanteen = asyncHandler(async (req, res) => {
  const canteen = await canteenService.createCanteen(req.body);
  res.status(201).json({
    success: true,
    data: canteen,
  });
});

const updateCanteen = asyncHandler(async (req, res) => {
  const canteen = await canteenService.updateCanteen(req.params.id, req.body);
  res.json({
    success: true,
    data: canteen,
  });
});

const toggleCanteenStatus = asyncHandler(async (req, res) => {
  const { acceptingOrders } = req.body;
  const canteen = await canteenService.toggleCanteenStatus(req.params.id, acceptingOrders);
  res.json({
    success: true,
    message: `Canteen is now ${canteen.acceptingOrders ? 'OPEN' : 'CLOSED'} for orders`,
    data: canteen,
  });
});

module.exports = {
  getCanteens,
  getCanteenById,
  getCanteenMenu,
  createCanteen,
  updateCanteen,
  toggleCanteenStatus,
};
