'use strict';

const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/v1/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const userId = req.user.id;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    meta: {
      ...buildMeta(page, limit, total),
      unreadCount,
    },
  });
});

/**
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
  res.json({
    success: true,
    data: { unreadCount: count },
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw ApiError.notFound('Notification');

  res.json({
    success: true,
    data: notification,
  });
});

/**
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
