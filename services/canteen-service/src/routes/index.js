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
      service: 'campusbite-canteen-service',
      port: process.env.PORT || 4001,
    },
  });
});

// Canteen & menu routes
router.use('/canteens', require('./canteen.routes'));
router.use('/menu-items', require('./menu.routes'));

module.exports = router;
