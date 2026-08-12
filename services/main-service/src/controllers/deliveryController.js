'use strict';

const DeliveryBatch = require('../models/DeliveryBatch');
const Order = require('../models/Order');
const User = require('../models/User');
const { transitionStatus } = require('../services/order/orderStateMachine');
const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS, CACHE_TTL, DELIVERY_BATCH_STATUS, ORDER_STATUS } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * GET /api/v1/delivery/batches
 */
const getAvailableBatches = asyncHandler(async (req, res) => {
  const partnerId = req.user.id;

  // Find batches that are either READY (available to claim) or assigned to this partner
  const batches = await DeliveryBatch.find({
    $or: [
      { status: DELIVERY_BATCH_STATUS.READY },
      { deliveryPartnerId: partnerId, status: { $ne: DELIVERY_BATCH_STATUS.COMPLETED } },
    ],
  })
    .populate('canteenId', 'name location contactPhone')
    .populate('hostelId', 'name shortCode blocks')
    .populate('orderIds', 'orderNumber status items deliveryDetails pricingBreakdown')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: batches,
  });
});

/**
 * GET /api/v1/delivery/batches/:id
 */
const getBatchById = asyncHandler(async (req, res) => {
  const batch = await DeliveryBatch.findById(req.params.id)
    .populate('canteenId', 'name location contactPhone')
    .populate('hostelId', 'name shortCode blocks')
    .populate({
      path: 'orderIds',
      populate: { path: 'studentId', select: 'name phone studentProfile' },
    });

  if (!batch) throw ApiError.notFound('Delivery batch');

  res.json({
    success: true,
    data: batch,
  });
});

/**
 * POST /api/v1/delivery/batches/:id/claim
 * Uses Redis distributed locking to prevent race conditions.
 */
const claimBatch = asyncHandler(async (req, res) => {
  const batchId = req.params.id;
  const partnerId = req.user.id;

  const redis = getRedisClient();
  const lockKey = REDIS_KEYS.deliveryBatchLock(batchId);

  // 1. Acquire Redis lock
  const lockAcquired = await redis.set(lockKey, partnerId, 'NX', 'EX', CACHE_TTL.BATCH_LOCK);
  if (!lockAcquired) {
    throw ApiError.conflict('BATCH_ALREADY_CLAIMED', 'Another partner is claiming this batch. Please refresh.');
  }

  try {
    // 2. Fetch batch & verify status is READY
    const batch = await DeliveryBatch.findById(batchId);
    if (!batch) throw ApiError.notFound('Delivery batch');

    if (batch.status !== DELIVERY_BATCH_STATUS.READY) {
      throw ApiError.badRequest(`Batch cannot be claimed because it is in '${batch.status}' status`);
    }

    // 3. Assign batch to partner
    batch.deliveryPartnerId = partnerId;
    batch.status = DELIVERY_BATCH_STATUS.ASSIGNED;
    batch.estimatedPickupAt = new Date(Date.now() + 15 * 60 * 1000);
    await batch.save();

    // Update orders in batch to ASSIGNED
    await Order.updateMany(
      { _id: { $in: batch.orderIds } },
      { $set: { status: ORDER_STATUS.ASSIGNED } }
    );

    // Update partner's active batch
    await User.findByIdAndUpdate(partnerId, {
      'deliveryProfile.activeDeliveryBatchId': batch._id,
    });

    logger.info({ msg: 'Delivery batch claimed successfully', batchNumber: batch.batchNumber, partnerId });

    res.json({
      success: true,
      message: 'Delivery batch claimed successfully!',
      data: batch,
    });
  } finally {
    // Release Redis lock
    await redis.del(lockKey);
  }
});

/**
 * PATCH /api/v1/delivery/batches/:id/status
 */
const updateBatchStatus = asyncHandler(async (req, res) => {
  const batchId = req.params.id;
  const { status } = req.body;
  const partnerId = req.user.id;

  const batch = await DeliveryBatch.findById(batchId);
  if (!batch) throw ApiError.notFound('Delivery batch');

  if (String(batch.deliveryPartnerId) !== String(partnerId)) {
    throw ApiError.forbidden('You can only update batches assigned to you');
  }

  batch.status = status;
  if (status === DELIVERY_BATCH_STATUS.PICKED_UP) {
    batch.actualPickupAt = new Date();
    // Update all order statuses to PICKED_UP
    await Order.updateMany({ _id: { $in: batch.orderIds } }, { $set: { status: ORDER_STATUS.PICKED_UP } });
  } else if (status === DELIVERY_BATCH_STATUS.OUT_FOR_DELIVERY) {
    await Order.updateMany({ _id: { $in: batch.orderIds } }, { $set: { status: ORDER_STATUS.OUT_FOR_DELIVERY } });
  } else if (status === DELIVERY_BATCH_STATUS.COMPLETED) {
    batch.actualDeliveryAt = new Date();
    await Order.updateMany({ _id: { $in: batch.orderIds } }, { $set: { status: ORDER_STATUS.COMPLETED } });
    await User.findByIdAndUpdate(partnerId, { $unset: { 'deliveryProfile.activeDeliveryBatchId': 1 } });
  }

  await batch.save();

  res.json({
    success: true,
    message: `Batch status updated to '${status}'`,
    data: batch,
  });
});

/**
 * PATCH /api/v1/delivery/orders/:orderId/delivered
 */
const markOrderDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order');

  await transitionStatus(order, ORDER_STATUS.DELIVERED, {
    id: req.user.id,
    role: 'DELIVERY_PARTNER',
    note: 'Marked delivered by partner',
  });

  res.json({
    success: true,
    message: 'Order marked as delivered',
    data: order,
  });
});

/**
 * PATCH /api/v1/delivery/availability
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { 'deliveryProfile.isAvailable': Boolean(isAvailable) },
    { new: true }
  );

  res.json({
    success: true,
    message: `Availability updated to ${Boolean(isAvailable) ? 'ONLINE' : 'OFFLINE'}`,
    data: user.toSafeObject(),
  });
});

module.exports = {
  getAvailableBatches,
  getBatchById,
  claimBatch,
  updateBatchStatus,
  markOrderDelivered,
  toggleAvailability,
};
