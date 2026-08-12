'use strict';

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const rateLimiter = require('../middleware/rateLimiter');
const { USER_ROLES } = require('../config/constants');

router.use(authenticate);

// Windows endpoint
router.get('/windows', orderController.getDeliveryWindows);

// Canteen Order Queue (Canteen Staff / Admin)
router.get(
  '/canteen/queue',
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  orderController.getCanteenOrderQueue
);

// General User endpoints (any authenticated user can place/view their own orders)
router.post(
  '/',
  rateLimiter({ endpoint: 'create_order', max: 10, windowSecs: 60, useUserId: true }),
  orderController.createOrder
);

router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/tracking', orderController.getOrderTracking);
router.get('/:id/invoice', orderController.downloadOrderInvoice);
router.get('/:id/pdf', orderController.downloadOrderInvoice);
router.patch('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrderFromHistory);
router.post('/:id/send-receipt', orderController.sendOrderReceiptToCustomDetails);
router.post('/:id/receipt', orderController.sendOrderReceiptToCustomDetails);

// Status updates (Canteen Staff / Partner / Admin)
router.patch(
  '/:id/status',
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.DELIVERY_PARTNER, USER_ROLES.ADMIN),
  orderController.updateOrderStatus
);

module.exports = router;
