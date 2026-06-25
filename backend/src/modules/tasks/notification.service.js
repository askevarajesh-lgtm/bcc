const Notification = require("./notification.model");

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 50, skip = 0, unreadOnly = false } = options;

  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate("taskId", "title status")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  return {
    notifications,
    total,
    unreadCount,
  };
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  return result;
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

/**
 * Delete multiple notifications
 */
const deleteNotifications = async (notificationIds, userId) => {
  const result = await Notification.deleteMany({
    _id: { $in: notificationIds },
    userId,
  });

  return result;
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
};
