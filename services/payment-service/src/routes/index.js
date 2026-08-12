'use strict';

const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'campusbite-payment-service',
      port: process.env.PORT || 4003,
    },
  });
});

// Payment routes
router.use('/payments', require('./payment.routes'));

module.exports = router;
