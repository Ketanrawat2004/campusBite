'use strict';

const paymentService = require('../services/payment/paymentService');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * POST /api/v1/payments/create
 */
const createPayment = asyncHandler(async (req, res) => {
  const orderData = req.body;
  if (!orderData || !orderData.pricingBreakdown || !orderData.pricingBreakdown.totalInPaise) {
    throw ApiError.badRequest('Invalid order data for payment creation');
  }

  const result = await paymentService.createRazorpayOrder(orderData);
  res.json({ success: true, data: result });
});

/**
 * POST /api/v1/payments/verify
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('Missing required payment verification parameters');
  }

  const result = await paymentService.processPaymentSuccess({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  res.json({
    success: true,
    message: 'Payment verified and order confirmed',
    data: {
      paymentStatus: result.payment.status,
    },
  });
});

/**
 * POST /api/v1/payments/webhook
 * Razorpay Webhook Callback
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer or raw string

  if (signature) {
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn({ msg: 'Invalid Razorpay webhook signature' });
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
  }

  logger.info({ msg: 'Razorpay webhook received', eventType: event.event });

  if (event.event === 'payment.captured') {
    const paymentEntity = event.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (payment) {
      await paymentService.processPaymentSuccess({
        orderId: payment.orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: 'mock_signature', // internal webhook trusted
      }).catch((err) => logger.error({ msg: 'Webhook payment process error', err: err.message }));
    }
  }

  res.json({ success: true, status: 'ok' });
});

/**
 * GET /api/v1/payments/:orderId
 */
const getPaymentByOrderId = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ orderId: req.params.orderId });
  if (!payment) throw ApiError.notFound('Payment');
  res.json({
    success: true,
    data: payment,
  });
});

module.exports = {
  createPayment,
  verifyPayment,
  handleWebhook,
  getPaymentByOrderId,
};
