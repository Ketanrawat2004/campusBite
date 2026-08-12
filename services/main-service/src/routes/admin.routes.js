'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { USER_ROLES } = require('../config/constants');

router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/dashboard/stats', adminController.getDashboardMetrics);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.get('/orders', adminController.getAdminOrders);
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:id', adminController.resolveComplaint);
router.post('/coupons', adminController.createCoupon);
router.get('/delivery-config', adminController.getDeliveryConfig);
router.put('/delivery-config', adminController.updateDeliveryConfig);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
