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
      service: 'campusbite-notification-service',
      port: process.env.PORT || 4004,
    },
  });
});

// Notification routes
router.use('/notifications', require('./notification.routes'));

module.exports = router;
