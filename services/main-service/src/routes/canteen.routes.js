'use strict';

const express = require('express');
const router = express.Router();
const canteenController = require('../controllers/canteenController');
const menuController = require('../controllers/menuController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const rateLimiter = require('../middleware/rateLimiter');
const { USER_ROLES } = require('../config/constants');

// Public routes
router.get('/', canteenController.getCanteens);
router.get('/:id', canteenController.getCanteenById);
router.get(
  '/:id/menu',
  rateLimiter({ endpoint: 'canteen_menu', max: 500, windowSecs: 60 }),
  canteenController.getCanteenMenu
);

// Admin protected
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), canteenController.createCanteen);

// Staff / Admin protected
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  canteenController.updateCanteen
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  canteenController.toggleCanteenStatus
);

// Staff menu endpoints
router.post(
  '/:id/categories',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.createCategory
);

router.post(
  '/:id/menu-items',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.createMenuItem
);

module.exports = router;
