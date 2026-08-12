'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.delete('/', profileController.deleteAccount);
router.patch('/password', profileController.changePassword);
router.patch('/hostel', profileController.updateHostelDetails);

module.exports = router;
