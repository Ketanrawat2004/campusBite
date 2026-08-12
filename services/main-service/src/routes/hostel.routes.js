'use strict';

const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { USER_ROLES } = require('../config/constants');

// Public
router.get('/', hostelController.getHostels);
router.get('/:id', hostelController.getHostelById);

// Admin protected
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), hostelController.createHostel);
router.patch('/:id', authenticate, authorize(USER_ROLES.ADMIN), hostelController.updateHostel);

module.exports = router;
