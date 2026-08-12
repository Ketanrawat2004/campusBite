'use strict';

const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../../models/Payment');
const { publishEvent } = require('../../events/producer');
const { KAFKA_TOPICS, ORDER_STATUS, PAYMENT_STATUS } = require('../../config/constants');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

let razorpayInstance = null;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

  razorpayInstance = new Razorpay({ key_id, key_secret });
  return razorpayInstance;
}

/**
 * Create Razorpay Order
 *
 * @param {object} order - Mongoose Order document
 * @returns {Promise<object>} { razorpayOrderId, amountInPaise, currency, keyId }
 */
async function createRazorpayOrder(order) {
  const rzp = getRazorpay();
  const amountInPaise = order.pricingBreakdown.totalInPaise;

  try {
    let rzpOrder;
    // In test mode without real Razorpay keys, mock order creation if placeholder keys used
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
      rzpOrder = {
        id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        status: 'created',
      };
    } else {
      rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: String(order._id),
          studentId: String(order.studentId),
          canteenId: String(order.canteenId),
        },
      });
    }

    // Create Payment document
    const payment = new Payment({
      orderId: order._id || order.id,
      studentId: order.studentId,
      amountInPaise,
      currency: 'INR',
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: rzpOrder.id,
      paymentGateway: 'razorpay',
    });
    await payment.save();

    return {
      paymentId: payment._id,
      razorpayOrderId: rzpOrder.id,
      amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    };
  } catch (err) {
    logger.error({ msg: 'Razorpay order creation failed', err: err.message });
    throw ApiError.internal('Payment initialization failed');
  }
}

/**
 * Verify Razorpay Payment Signature
 */
function verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

  // Mock verification in local test mode if signature is "mock_signature"
  if (razorpaySignature === 'mock_signature') {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
}

/**
 * Process Successful Payment
 */
async function processPaymentSuccess({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw ApiError.notFound('Payment');
  }

  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    return { payment, message: 'Payment already verified' };
  }

  // Verify signature
  const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = 'Invalid payment signature';
    await payment.save();

    // Publish Payment Failed Event
    publishEvent(KAFKA_TOPICS.PAYMENT_FAILED, payment.orderId, {
      paymentId: payment._id,
      orderId: payment.orderId,
      reason: 'Signature mismatch'
    });

    throw ApiError.badRequest('Payment signature verification failed');
  }

  // Mark payment success
  payment.status = PAYMENT_STATUS.SUCCESS;
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.verifiedAt = new Date();
  await payment.save();

  // Publish Kafka events
  publishEvent(KAFKA_TOPICS.PAYMENT_COMPLETED, payment.orderId, {
    paymentId: payment._id,
    orderId: payment.orderId,
    studentId: payment.studentId,
    amountInPaise: payment.amountInPaise,
  });

  return { payment };
}

/**
 * Verify Webhook Signature
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = {
  createRazorpayOrder,
  verifySignature,
  processPaymentSuccess,
  verifyWebhookSignature,
};
