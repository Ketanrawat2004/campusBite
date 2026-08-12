'use strict';

const { ORDER_STATUS, VALID_ORDER_TRANSITIONS } = require('../../config/constants');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Order State Machine
 * Ensures state transitions strictly follow valid paths.
 */

/**
 * Verify if transition from currentStatus to nextStatus is allowed
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
function isValidTransition(currentStatus, nextStatus) {
  const allowedNextStates = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  return allowedNextStates.includes(nextStatus);
}

/**
 * Execute a status transition on an order document
 * @param {object} order - Mongoose order document
 * @param {string} nextStatus - Desired next status
 * @param {object} actor - { id, role, note }
 * @returns {Promise<object>} Updated order document
 */
async function transitionStatus(order, nextStatus, actor = {}) {
  const currentStatus = order.status;

  if (currentStatus === nextStatus) {
    return order; // No-op
  }

  if (!isValidTransition(currentStatus, nextStatus)) {
    logger.warn({
      msg: 'Invalid order status transition attempt',
      orderId: order._id,
      orderNumber: order.orderNumber,
      from: currentStatus,
      to: nextStatus,
      actor,
    });
    throw ApiError.invalidStatusTransition(currentStatus, nextStatus);
  }

  // Record transition
  order.status = nextStatus;
  order.statusHistory.push({
    status: nextStatus,
    timestamp: new Date(),
    actorId: actor.id || null,
    actorRole: actor.role || 'SYSTEM',
    note: actor.note || '',
  });

  // Handle timestamp updates based on status
  if (nextStatus === ORDER_STATUS.READY) {
    order.actualReadyAt = new Date();
  } else if (nextStatus === ORDER_STATUS.DELIVERED) {
    order.actualDeliveryAt = new Date();
  }

  await order.save();

  logger.info({
    msg: 'Order status transition success',
    orderNumber: order.orderNumber,
    from: currentStatus,
    to: nextStatus,
  });

  return order;
}

module.exports = {
  isValidTransition,
  transitionStatus,
};
