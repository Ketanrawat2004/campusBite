'use strict';

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Notification = require('../models/Notification');
const Order = require('../models/Order');

router.use(authenticate);

// GET /api/v1/notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.sub;
    let notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);

    // If no notifications exist yet, generate real notifications from user's actual order history
    if (notifications.length === 0 && userId) {
      const orders = await Order.find({ studentId: userId }).sort({ createdAt: -1 }).limit(10);
      if (orders.length > 0) {
        const docsToCreate = orders.map((order) => {
          const totalPaid = `₹${((order.pricingBreakdown?.totalInPaise || 0) / 100).toFixed(2)}`;
          return {
            userId,
            title: `Order #${order.orderNumber} ${order.status}`,
            message: `Your order of ${order.items?.length || 1} item(s) total ${totalPaid} is currently ${order.status}.`,
            type: 'ORDER_UPDATE',
            isRead: false,
            relatedEntity: { id: order._id, type: 'Order' },
            createdAt: order.createdAt || new Date(),
          };
        });
        notifications = await Notification.insertMany(docsToCreate);
      }
    }

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.sub;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.sub;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
