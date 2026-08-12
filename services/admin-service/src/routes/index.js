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
      service: 'campusbite-admin-service',
      port: process.env.PORT || 4002,
    },
  });
});

// Admin service routes
router.use('/admin', require('./admin.routes'));
router.use('/hostels', require('./hostel.routes'));
router.use('/issues', require('./issue.routes'));

module.exports = router;
