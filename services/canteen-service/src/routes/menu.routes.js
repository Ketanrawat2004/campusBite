'use strict';

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { USER_ROLES } = require('../config/constants');

// Search is public
router.get('/search', menuController.searchMenuItems);

// Category updates (Staff / Admin)
router.patch(
  '/categories/:id',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.updateCategory
);

router.delete(
  '/categories/:id',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.deleteCategory
);

// Item updates (Staff / Admin)
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.updateMenuItem
);

router.patch(
  '/:id/availability',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.toggleItemAvailability
);

router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.CANTEEN_STAFF, USER_ROLES.ADMIN),
  menuController.deleteMenuItem
);

module.exports = router;
