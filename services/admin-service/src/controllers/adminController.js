'use strict';

const User = require('../models/User');
const Order = require('../models/Order');
const Canteen = require('../models/Canteen');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Coupon = require('../models/Coupon');
const DeliveryConfig = require('../models/DeliveryConfig');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/v1/admin/dashboard
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    ordersToday,
    revenueTodayResult,
    deliveryOrdersCount,
    pickupOrdersCount,
    activeDeliveryPartners,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Payment.aggregate([
      { $match: { status: 'SUCCESS', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amountInPaise' } } },
    ]),
    Order.countDocuments({ fulfillmentType: 'DELIVERY', createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ fulfillmentType: 'PICKUP', createdAt: { $gte: startOfDay } }),
    User.countDocuments({ role: 'DELIVERY_PARTNER', 'deliveryProfile.isAvailable': true }),
  ]);

  const revenueTodayInPaise = revenueTodayResult[0]?.total || 0;

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      ordersToday,
      revenueTodayInPaise,
      deliveryOrdersCount,
      pickupOrdersCount,
      activeDeliveryPartners,
    },
  });
});

/**
 * GET /api/v1/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users.map((u) => u.toSafeObject()),
    meta: buildMeta(page, limit, total),
  });
});

/**
 * PATCH /api/v1/admin/users/:id
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const updates = {};
  if (isActive !== undefined) updates.isActive = Boolean(isActive);
  if (role) updates.role = role;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw ApiError.notFound('User');

  res.json({
    success: true,
    data: user.toSafeObject(),
  });
});

/**
 * GET /api/v1/admin/orders
 */
const getAdminOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.fulfillmentType) filter.fulfillmentType = req.query.fulfillmentType;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('studentId', 'name email phone')
      .populate('canteenId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    meta: buildMeta(page, limit, total),
  });
});

/**
 * GET /api/v1/admin/complaints
 */
const getComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('studentId', 'name email phone')
      .populate('canteenId', 'name')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: complaints,
    meta: buildMeta(page, limit, total),
  });
});

/**
 * PATCH /api/v1/admin/complaints/:id
 */
const resolveComplaint = asyncHandler(async (req, res) => {
  const { resolution, status = 'RESOLVED' } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    {
      resolution,
      status,
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
    },
    { new: true }
  );

  if (!complaint) throw ApiError.notFound('Complaint');

  res.json({
    success: true,
    message: 'Complaint resolved',
    data: complaint,
  });
});

/**
 * POST /api/v1/admin/coupons
 */
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = new Coupon({
    ...req.body,
    collegeId: req.user.collegeId,
  });
  await coupon.save();

  res.status(201).json({
    success: true,
    data: coupon,
  });
});

/**
 * GET /api/v1/admin/delivery-config
 */
const getDeliveryConfig = asyncHandler(async (req, res) => {
  let config = await DeliveryConfig.findOne({ collegeId: req.user.collegeId });
  if (!config) {
    config = await DeliveryConfig.create({
      collegeId: req.user.collegeId,
      tiers: [
        { minOrders: 1, maxOrders: 1, feeInPaise: 2000, label: 'SOLO' },
        { minOrders: 2, maxOrders: 3, feeInPaise: 1500, label: 'SMALL' },
        { minOrders: 4, maxOrders: 99, feeInPaise: 1000, label: 'LARGE' },
      ],
    });
  }
  res.json({
    success: true,
    data: config,
  });
});

/**
 * PUT /api/v1/admin/delivery-config
 */
const updateDeliveryConfig = asyncHandler(async (req, res) => {
  const config = await DeliveryConfig.findOneAndUpdate(
    { collegeId: req.user.collegeId },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Delivery configuration updated successfully',
    data: config,
  });
});

/**
 * GET /api/v1/admin/audit-logs
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [logs, total] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: buildMeta(page, limit, total),
  });
});

module.exports = {
  getDashboardMetrics,
  getUsers,
  updateUserStatus,
  getAdminOrders,
  getComplaints,
  resolveComplaint,
  createCoupon,
  getDeliveryConfig,
  updateDeliveryConfig,
  getAuditLogs,
};
