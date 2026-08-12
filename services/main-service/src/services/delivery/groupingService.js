'use strict';

const DeliveryBatch = require('../../models/DeliveryBatch');
const DeliveryConfig = require('../../models/DeliveryConfig');
const Order = require('../../models/Order');
const { getRedisClient } = require('../../config/redis');
const { REDIS_KEYS, CACHE_TTL, DELIVERY_BATCH_STATUS, FULFILLMENT_TYPE } = require('../../config/constants');
const { getWindowKey } = require('./deliveryWindowService');
const { generateBatchNumber } = require('../../utils/orderNumber');
const logger = require('../../utils/logger');

/**
 * Smart Group Delivery Service
 *
 * Groups hostel delivery orders from the same canteen heading to the same hostel
 * within the same time window into single delivery batches.
 */

/**
 * Attempt to add an order to an active forming delivery batch or create a new batch.
 *
 * @param {object} order - Mongoose order document
 * @returns {Promise<object>} Assigned DeliveryBatch document
 */
async function processOrderForGrouping(order) {
  if (order.fulfillmentType !== FULFILLMENT_TYPE.DELIVERY) {
    return null; // Pickup orders don't get batched
  }

  const { canteenId, collegeId, deliveryDetails } = order;
  if (!deliveryDetails || !deliveryDetails.hostelId || !deliveryDetails.requestedDeliveryWindow) {
    logger.warn({ msg: 'Delivery order missing hostelId or window', orderId: order._id });
    return null;
  }

  const hostelId = deliveryDetails.hostelId;
  const windowKey = getWindowKey(deliveryDetails.requestedDeliveryWindow.startTime);

  // Grouping lock key in Redis
  const lockKey = REDIS_KEYS.groupingLock(canteenId, hostelId, windowKey);
  const redis = getRedisClient();

  // Try to acquire Redis lock with retry
  let lockAcquired = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await redis.set(lockKey, '1', 'NX', 'EX', CACHE_TTL.GROUPING_LOCK);
    if (res === 'OK') {
      lockAcquired = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 100)); // wait 100ms
  }

  if (!lockAcquired) {
    logger.warn({ msg: 'Could not acquire grouping lock, retrying without lock', lockKey });
  }

  try {
    // Get delivery config for maxBatchSize
    const config = await DeliveryConfig.findOne({ collegeId });
    const maxBatchSize = config?.maxBatchSize || 8;

    // Search for an active FORMING batch
    let batch = await DeliveryBatch.findOne({
      canteenId,
      hostelId,
      status: DELIVERY_BATCH_STATUS.FORMING,
      'groupingMetadata.windowKey': windowKey,
      orderCount: { $lt: maxBatchSize },
    });

    if (batch) {
      // Add order to existing batch
      if (!batch.orderIds.includes(order._id)) {
        batch.orderIds.push(order._id);
        batch.orderCount = batch.orderIds.length;
        await batch.save();
      }
      logger.info({
        msg: 'Order added to existing forming batch',
        orderNumber: order.orderNumber,
        batchNumber: batch.batchNumber,
        orderCount: batch.orderCount,
      });
    } else {
      // Create a new batch
      batch = new DeliveryBatch({
        batchNumber: generateBatchNumber(),
        collegeId,
        canteenId,
        hostelId,
        orderIds: [order._id],
        orderCount: 1,
        deliveryWindowStart: deliveryDetails.requestedDeliveryWindow.startTime,
        deliveryWindowEnd: deliveryDetails.requestedDeliveryWindow.endTime,
        status: DELIVERY_BATCH_STATUS.FORMING,
        groupingMetadata: {
          groupingKey: `${canteenId}:${hostelId}:${windowKey}`,
          windowKey,
          pricingTier: 'SOLO',
        },
      });
      await batch.save();
      logger.info({
        msg: 'New forming delivery batch created',
        orderNumber: order.orderNumber,
        batchNumber: batch.batchNumber,
      });
    }

    // Link batch to order
    order.deliveryBatchId = batch._id;
    await order.save();

    return batch;
  } finally {
    if (lockAcquired) {
      await redis.del(lockKey);
    }
  }
}

/**
 * Recalculate fee tier for a batch based on order count
 * @param {number} count
 * @param {object} config
 * @returns {{ feeInPaise: number, tierLabel: string }}
 */
function calculateBatchFeePerOrder(count, config) {
  const tiers = config?.tiers || [
    { minOrders: 1, maxOrders: 1, feeInPaise: 2000, label: 'SOLO' },
    { minOrders: 2, maxOrders: 3, feeInPaise: 1500, label: 'SMALL' },
    { minOrders: 4, maxOrders: 99, feeInPaise: 1000, label: 'LARGE' },
  ];

  const matchedTier = tiers.find((t) => count >= t.minOrders && count <= t.maxOrders);
  if (matchedTier) {
    return { feeInPaise: matchedTier.feeInPaise, tierLabel: matchedTier.label };
  }
  return { feeInPaise: tiers[tiers.length - 1].feeInPaise, tierLabel: 'LARGE' };
}

/**
 * Finalize forming batches whose window has passed or max size reached
 */
async function finalizeFormingBatches() {
  const now = new Date();
  const formingBatches = await DeliveryBatch.find({
    status: DELIVERY_BATCH_STATUS.FORMING,
  });

  for (const batch of formingBatches) {
    const isWindowExpired = batch.deliveryWindowEnd && batch.deliveryWindowEnd <= now;
    const config = await DeliveryConfig.findOne({ collegeId: batch.collegeId });
    const maxBatchSize = config?.maxBatchSize || 8;
    const isFull = batch.orderCount >= maxBatchSize;

    if (isWindowExpired || isFull) {
      // Calculate fee per order
      const { feeInPaise, tierLabel } = calculateBatchFeePerOrder(batch.orderCount, config);

      batch.status = DELIVERY_BATCH_STATUS.READY;
      batch.deliveryFeePerOrderInPaise = feeInPaise;
      if (!batch.groupingMetadata) batch.groupingMetadata = {};
      batch.groupingMetadata.pricingTier = tierLabel;
      await batch.save();

      logger.info({
        msg: 'Delivery batch finalized and ready for partner',
        batchNumber: batch.batchNumber,
        orderCount: batch.orderCount,
        feePerOrder: feeInPaise,
        tierLabel,
      });
    }
  }
}

module.exports = {
  processOrderForGrouping,
  finalizeFormingBatches,
  calculateBatchFeePerOrder,
};
