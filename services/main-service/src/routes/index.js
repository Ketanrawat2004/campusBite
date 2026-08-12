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
      service: 'campusbite-api',
    },
  });
});

// Route groups
router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/canteens', require('./canteen.routes'));
router.use('/hostels', require('./hostel.routes'));
router.use('/menu-items', require('./menu.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/delivery', require('./delivery.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/issues', require('./issue.routes'));
router.use('/notifications', require('./notification.routes'));

module.exports = router;
