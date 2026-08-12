'use strict';

const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// Student routes
router.post('/', issueController.createIssue);
router.get('/order/:orderId', issueController.getOrderIssues);

// Canteen Staff routes
router.get('/canteen', authorize('CANTEEN_STAFF', 'ADMIN'), issueController.getCanteenIssues);
router.patch('/:issueId/reply', authorize('CANTEEN_STAFF', 'ADMIN'), issueController.replyIssue);

module.exports = router;
