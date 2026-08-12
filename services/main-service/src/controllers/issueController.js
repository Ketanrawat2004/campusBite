'use strict';

const Issue = require('../models/Issue');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/issues
 * Student reports an issue on an order.
 */
const createIssue = asyncHandler(async (req, res) => {
  const { orderId, issueType, studentMessage } = req.body;
  if (!orderId || !issueType || !studentMessage) {
    throw ApiError.badRequest('Order ID, issue type, and message are required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order');
  }

  const issue = new Issue({
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId: req.user.id,
    canteenId: order.canteenId,
    issueType,
    studentMessage: studentMessage.trim(),
    status: 'OPEN',
  });

  await issue.save();

  res.status(201).json({
    success: true,
    message: 'Issue reported to canteen staff successfully',
    data: issue,
  });
});

/**
 * GET /api/v1/issues/order/:orderId
 * Get issues reported for a specific order.
 */
const getOrderIssues = asyncHandler(async (req, res) => {
  const issues = await Issue.find({ orderId: req.params.orderId })
    .populate('repliedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: issues,
  });
});

/**
 * GET /api/v1/issues/canteen
 * Canteen staff gets all issues reported to their canteen (or all campus issues).
 */
const getCanteenIssues = asyncHandler(async (req, res) => {
  const canteenId = req.user?.canteenId;
  const filter = {};
  if (canteenId && canteenId !== 'undefined' && canteenId !== 'null') {
    filter.canteenId = canteenId;
  }

  const issues = await Issue.find(filter)
    .populate('studentId', 'name phone email')
    .populate('canteenId', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: issues,
  });
});

/**
 * PATCH /api/v1/issues/:issueId/reply
 * Canteen staff replies to an issue and updates status.
 */
const replyIssue = asyncHandler(async (req, res) => {
  const { staffReply, status } = req.body;
  if (!staffReply) {
    throw ApiError.badRequest('Reply message is required');
  }

  const issue = await Issue.findById(req.params.issueId);
  if (!issue) {
    throw ApiError.notFound('Issue');
  }

  issue.staffReply = staffReply.trim();
  issue.status = status || 'RESOLVED';
  issue.repliedAt = new Date();
  issue.repliedBy = req.user.id;

  await issue.save();

  res.json({
    success: true,
    message: 'Reply and resolution saved successfully',
    data: issue,
  });
});

module.exports = {
  createIssue,
  getOrderIssues,
  getCanteenIssues,
  replyIssue,
};
