'use strict';

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const rateLimiter = require('../middleware/rateLimiter');

// Public Webhook endpoint
router.post('/webhook', paymentController.handleWebhook);

// Internal / Protected payment endpoints
router.post('/create', paymentController.createPayment);
router.post('/verify', paymentController.verifyPayment);

router.get('/:orderId', authenticate, paymentController.getPaymentByOrderId);

module.exports = router;
