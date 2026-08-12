'use strict';

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { USER_ROLES } = require('../config/constants');

router.use(authenticate, authorize(USER_ROLES.DELIVERY_PARTNER, USER_ROLES.ADMIN));

router.get('/batches', deliveryController.getAvailableBatches);
router.get('/batches/:id', deliveryController.getBatchById);
router.post('/batches/:id/claim', deliveryController.claimBatch);
router.patch('/batches/:id/status', deliveryController.updateBatchStatus);
router.patch('/orders/:orderId/delivered', deliveryController.markOrderDelivered);
router.patch('/availability', deliveryController.toggleAvailability);

module.exports = router;
