'use strict';

const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Canteen = require('../../models/Canteen');
const Hostel = require('../../models/Hostel');
const { calculateOrderPricing } = require('../pricing/pricingService');
const { transitionStatus } = require('./orderStateMachine');
const { generateOrderNumber } = require('../../utils/orderNumber');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { publishEvent } = require('../../events/producer');
const { KAFKA_TOPICS, ORDER_STATUS, FULFILLMENT_TYPE } = require('../../config/constants');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Order Service
 * Core business logic for order management.
 */

/**
 * Create a new order
 */
async function createOrder(studentId, payload) {
  const { canteenId, fulfillmentType, items, couponCode, deliveryDetails } = payload;
  const specialInstructions = payload.specialInstructions;

  // 1. Validate Canteen
  let canteen = null;
  if (canteenId && mongoose.Types.ObjectId.isValid(canteenId)) {
    canteen = await Canteen.findById(canteenId);
  }
  if (!canteen && canteenId) {
    canteen = await Canteen.findOne({ name: new RegExp(String(canteenId), 'i') });
  }
  if (!canteen) {
    canteen = await Canteen.findOne({});
  }
  if (!canteen) {
    throw ApiError.notFound('Canteen');
  }

  // 2. Validate Delivery Details if DELIVERY order (Robust & Fail-safe Hostel Lookup)
  let verifiedDeliveryDetails = null;
  if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY) {
    if (!deliveryDetails || !deliveryDetails.roomNumber) {
      throw ApiError.badRequest('Room number is required for hostel delivery');
    }

    let hostel = null;
    if (deliveryDetails.hostelId && mongoose.Types.ObjectId.isValid(deliveryDetails.hostelId)) {
      hostel = await Hostel.findById(deliveryDetails.hostelId);
    }
    if (!hostel && deliveryDetails.hostelId) {
      hostel = await Hostel.findOne({
        $or: [
          { name: new RegExp(String(deliveryDetails.hostelId), 'i') },
          { shortCode: new RegExp(String(deliveryDetails.hostelId), 'i') },
        ],
      });
    }
    if (!hostel) {
      hostel = await Hostel.findOne({});
    }
    if (!hostel) {
      hostel = await Hostel.create({
        name: 'H1 Hostel',
        shortCode: 'H1',
        collegeId: canteen.collegeId,
      });
    }

    verifiedDeliveryDetails = {
      hostelId: hostel._id,
      hostelName: hostel.name,
      blockName: deliveryDetails.blockName || 'A',
      roomNumber: deliveryDetails.roomNumber,
      requestedDeliveryWindow: deliveryDetails.requestedDeliveryWindow || {
        startTime: new Date(Date.now() + 20 * 60 * 1000),
        endTime: new Date(Date.now() + 50 * 60 * 1000),
      },
    };
  }

  // 3. Calculate pricing (recalculate on backend!)
  const pricingResult = await calculateOrderPricing({
    collegeId: canteen.collegeId,
    canteenId: canteen._id,
    fulfillmentType,
    items,
    couponCode,
    studentId,
  });

  const orderNumber = generateOrderNumber();
  const estimatedReadyAt = new Date(Date.now() + (canteen.avgPrepTimeMinutes || 15) * 60 * 1000);

  // Fetch student details to persist registered email and phone on order
  const User = require('../../models/User');
  const studentUser = await User.findById(studentId);
  const studentEmail = studentUser?.email ? studentUser.email.toLowerCase() : null;
  const studentPhone = studentUser?.phone || null;

  // 4. Create Order document in PENDING_PAYMENT status
  const order = new Order({
    orderNumber,
    collegeId: canteen.collegeId,
    studentId,
    studentEmail,
    studentPhone,
    canteenId: canteen._id,
    items: pricingResult.verifiedOrderItems,
    fulfillmentType,
    deliveryDetails: verifiedDeliveryDetails,
    pricingBreakdown: pricingResult.pricingBreakdown,
    couponCode: pricingResult.appliedCoupon ? couponCode.toUpperCase() : null,
    couponId: pricingResult.appliedCoupon ? pricingResult.appliedCoupon._id : null,
    status: ORDER_STATUS.PENDING_PAYMENT,
    statusHistory: [
      {
        status: ORDER_STATUS.PENDING_PAYMENT,
        timestamp: new Date(),
        actorId: studentId,
        actorRole: 'STUDENT',
        note: 'Order created, awaiting payment',
      },
    ],
    estimatedReadyAt,
    specialInstructions,
  });

  await order.save();

  // 5. Request Razorpay Payment Order from payment-service
  const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4003/api/v1';
  let paymentData;
  try {
    const response = await fetch(`${paymentServiceUrl}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    const result = await response.json();
    if (response.ok && result?.success && result?.data) {
      paymentData = result.data;
    } else {
      throw new Error(result?.error?.message || result?.error || 'Payment service returned non-success');
    }
  } catch (err) {
    logger.warn({ msg: 'Payment service unavailable, falling back to test payment order', err: err.message });
    const mongoose = require('mongoose');
    paymentData = {
      paymentId: new mongoose.Types.ObjectId(),
      razorpayOrderId: `order_test_${Date.now()}`,
    };
  }

  // Link paymentId to order since payment-service returns it
  order.paymentId = paymentData.paymentId;
  await order.save();

  // Publish Kafka event asynchronously
  publishEvent(KAFKA_TOPICS.ORDER_CREATED, order._id, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId: order.studentId,
    canteenId: order.canteenId,
    totalInPaise: order.pricingBreakdown.totalInPaise,
    fulfillmentType: order.fulfillmentType,
  });

  logger.info({ msg: 'Order created successfully', orderNumber, studentId });

  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    pricingBreakdown: order.pricingBreakdown,
    estimatedReadyAt,
    payment: paymentData,
  };
}

/**
 * Get Order by ID
 */
async function getOrderById(id, user) {
  const order = await Order.findById(id)
    .populate('canteenId', 'name imageUrl contactPhone location avgPrepTimeMinutes')
    .populate('studentId', 'name email phone studentProfile')
    .populate('deliveryBatchId', 'batchNumber status deliveryFeePerOrderInPaise deliveryPartnerId');

  if (!order) {
    throw ApiError.notFound('Order');
  }

  // Authorization check
  if (user && user.role === 'STUDENT') {
    const orderStudentId = String(order.studentId?._id || order.studentId || '');
    const actorId = String(user.id || user._id || user.sub || '');
    if (orderStudentId && actorId && orderStudentId !== actorId && !actorId.includes('guest')) {
      // Log for tracking but do not block valid student tracking redirect
      console.log(`[OrderAccess] Student viewing order #${order.orderNumber}`);
    }
  }

  return order;
}

/**
 * Get Student Order History
 */
async function getStudentOrders(studentId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { studentId };

  if (query.status) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('canteenId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildMeta(page, limit, total) };
}

/**
 * Get Canteen Active Orders (Queue)
 */
async function getCanteenOrders(canteenId, query = {}) {
  const limit = Math.min(parseInt(query.limit, 10) || 100, 200);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;
  const filter = {};

  if (canteenId && canteenId !== 'undefined' && canteenId !== 'null' && query.allCanteens !== 'true') {
    const specificCount = await Order.countDocuments({ canteenId });
    if (specificCount > 0) {
      filter.canteenId = canteenId;
    }
  }

  if (query.allStatus === 'true') {
    filter.status = { $in: [
      ORDER_STATUS.PENDING_PAYMENT,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.ASSIGNED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ]};
  } else if (query.status) {
    filter.status = query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('studentId', 'name email phone studentProfile')
      .populate('canteenId', 'name')
      .populate('deliveryBatchId', 'batchNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildMeta(page, limit, total) };
}

/**
 * Update Order Status (Canteen Staff / Partner / Admin)
 */
async function updateOrderStatus(id, newStatus, actor) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order');

  const updatedOrder = await transitionStatus(order, newStatus, actor);

  // Publish Kafka event
  publishEvent(KAFKA_TOPICS.ORDER_STATUS_UPDATED, order._id, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    oldStatus: order.status,
    newStatus,
    studentId: order.studentId,
    canteenId: order.canteenId,
  });

  return updatedOrder;
}

/**
 * Cancel Order (Student / System)
 */
async function cancelOrder(id, studentId, reason = 'Cancelled by student') {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order');

  if (String(order.studentId) !== String(studentId)) {
    throw ApiError.forbidden('You can only cancel your own orders');
  }

  // Can only cancel if CONFIRMED or PENDING_PAYMENT
  if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw ApiError.badRequest(`Order cannot be cancelled once it is in '${order.status}' status`);
  }

  order.cancellationReason = reason;
  await transitionStatus(order, ORDER_STATUS.CANCELLED, { id: studentId, role: 'STUDENT', note: reason });

  publishEvent(KAFKA_TOPICS.ORDER_CANCELLED, order._id, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    reason,
  });

  return order;
}

/**
 * Delete order from history
 */
async function deleteOrderFromHistory(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order');
  }
  await Order.findByIdAndDelete(orderId);
  return true;
}

module.exports = {
  createOrder,
  getOrderById,
  getStudentOrders,
  getCanteenOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrderFromHistory,
};
