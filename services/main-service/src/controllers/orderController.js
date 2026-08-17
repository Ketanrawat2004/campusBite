'use strict';

const orderService = require('../services/order/orderService');
const { getAvailableDeliveryWindows } = require('../services/delivery/deliveryWindowService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

/**
 * GET /api/v1/orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getStudentOrders(req.user.id, req.query);
  res.json({
    success: true,
    data: result.orders,
    meta: result.meta,
  });
});

/**
 * GET /api/v1/orders/windows
 */
const getDeliveryWindows = asyncHandler(async (req, res) => {
  const windows = getAvailableDeliveryWindows();
  res.json({
    success: true,
    data: windows,
  });
});

/**
 * GET /api/v1/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.json({
    success: true,
    data: order,
  });
});

/**
 * GET /api/v1/orders/:id/tracking
 */
const getOrderTracking = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      statusHistory: order.statusHistory,
      estimatedReadyAt: order.estimatedReadyAt,
      actualReadyAt: order.actualReadyAt,
      deliveryBatch: order.deliveryBatchId || null,
      deliveryDetails: order.deliveryDetails || null,
      items: order.items || [],
      pricingBreakdown: order.pricingBreakdown || null,
      canteen: order.canteenId || null,
      student: order.studentId || null,
    },
  });
});

/**
 * PATCH /api/v1/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await orderService.cancelOrder(req.params.id, req.user.id, reason);
  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

/**
 * GET /api/v1/orders/canteen/queue (Canteen Staff)
 */
const getCanteenOrderQueue = asyncHandler(async (req, res) => {
  let canteenId = req.query.canteenId || (req.query.allCanteens === 'true' ? null : req.user?.canteenId);
  if (canteenId === 'ALL') canteenId = null;
  const result = await orderService.getCanteenOrders(canteenId, req.query);
  res.json({
    success: true,
    data: result.orders,
    meta: result.meta,
  });
});

/**
 * PATCH /api/v1/orders/:id/status (Canteen Staff / Admin)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, {
    id: req.user.id,
    role: req.user.role,
    note,
  });
  res.json({
    success: true,
    message: `Order status updated to '${status}'`,
    data: order,
  });
});

/**
 * DELETE /api/v1/orders/:id
 */
const deleteOrderFromHistory = asyncHandler(async (req, res) => {
  await orderService.deleteOrderFromHistory(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Order removed from history successfully',
  });
});

/**
 * POST /api/v1/orders/:id/send-receipt
 */
const sendOrderReceiptToCustomDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phone, email } = req.body;

  const User = require('../models/User');
  const Order = require('../models/Order');
  const ApiError = require('../utils/ApiError');
  const logger = require('../utils/logger');

  const order = await Order.findById(id).populate('studentId').populate('canteenId');
  if (!order) throw ApiError.notFound('Order not found');

  // Fetch actual User from MongoDB to guarantee User.email
  let customerUser = typeof order.studentId === 'object' && order.studentId?.email ? order.studentId : null;
  if (!customerUser && order.studentId) {
    customerUser = await User.findById(order.studentId);
  }
  if (!customerUser && req.user?.id) {
    customerUser = await User.findById(req.user.id);
  }

  const fallbackEmail = req.user?.email || order.studentEmail || process.env.EMAIL_USER || 'krishnapex1@gmail.com';
  const userEmailFromMongoDB = customerUser?.email ? customerUser.email.toLowerCase() : fallbackEmail;
  const nodemailerRecipient = userEmailFromMongoDB;

  const studentName = customerUser?.name || req.user?.name || 'Student Customer';
  const canteenName = order.canteenId?.name || 'Campus Canteen';
  const targetPhone = customerUser?.phone || order.studentPhone || req.user?.phone || '9876543210';

  // 1. Send Email Receipt via SMTP Client
  const notificationClient = require('../utils/notificationClient');
  try {
    await notificationClient.sendOrderConfirmationEmail({
      to: nodemailerRecipient,
      studentName,
      orderNumber: order.orderNumber,
      canteenName,
      items: order.items || [],
      pricingBreakdown: order.pricingBreakdown,
      fulfillmentType: order.fulfillmentType,
      deliveryDetails: order.deliveryDetails,
      createdAt: order.createdAt,
      status: order.status,
      paymentId: order.paymentId,
      authenticatedUserId,
    });
  } catch (e) {
    logger.error({ msg: 'Send email receipt error', err: e.message });
    throw ApiError.badRequest(`Email could not be delivered to ${nodemailerRecipient}: ${e.message}`);
  }

  // 2. Send WhatsApp Receipt via Meta API Client
  try {
    await notificationClient.sendWhatsAppOrderReceipt({
      toPhone: targetPhone,
      studentName,
      orderNumber: order.orderNumber,
      orderId: order._id,
      totalAmountInPaise: order.pricingBreakdown?.totalInPaise || 0,
      fulfillmentType: order.fulfillmentType,
    });
  } catch (w) {
    logger.warn({ msg: 'Send WhatsApp receipt warning', err: w.message });
  }

  res.json({
    success: true,
    message: `Receipt dispatched successfully to WhatsApp (+91 ${targetPhone}) and email (${nodemailerRecipient})`,
  });
});

/**
 * GET /api/v1/orders/:id/invoice
 * Returns the exact same PDF Tax Invoice binary Buffer as sent via email
 */
const downloadOrderInvoice = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  const invoiceService = require('../services/invoiceService');
  const pdfBuffer = await invoiceService.generateOrderInvoicePdf(order);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="CampusBite-Invoice-${order.orderNumber}.pdf"`
  );
  res.send(pdfBuffer);
});

module.exports = {
  createOrder,
  getMyOrders,
  getDeliveryWindows,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  getCanteenOrderQueue,
  updateOrderStatus,
  deleteOrderFromHistory,
  sendOrderReceiptToCustomDetails,
  downloadOrderInvoice,
};
