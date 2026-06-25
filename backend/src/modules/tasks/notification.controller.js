const notificationService = require("./notification.service");
const { sendSuccess, sendError } = require('./shimResponse');

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(
      req.user._id,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === "true",
      },
    );

    return sendSuccess(res, "Notifications retrieved successfully", result);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user._id);
    return sendSuccess(res, "Notification marked as read", { notification });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, "All notifications marked as read", {
      count: result.modifiedCount,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id, req.user._id);
    return sendSuccess(res, "Notification deleted successfully");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * Delete multiple notifications
 */
const deleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return sendError(res, 400, "Notification IDs array is required");
    }

    const result = await notificationService.deleteNotifications(
      notificationIds,
      req.user._id,
    );
    return sendSuccess(res, "Notifications deleted successfully", {
      count: result.deletedCount,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
};
