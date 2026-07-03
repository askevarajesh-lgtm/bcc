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

const CompanyNotificationSettings = require("./companyNotificationSettings.model");
const User = require("../auth/user.model");

/**
 * Dispatch system notification
 */
const dispatchSystemNotification = async (companyId, triggerKey, type, title, message, metadata = {}) => {
  try {
    // Check if the trigger is enabled in company settings
    const settings = await CompanyNotificationSettings.findOne({ companyId });
    if (!settings || !settings.systemTriggers || !settings.systemTriggers[triggerKey]) {
      return; // Not configured or disabled
    }

    const triggerSettings = settings.systemTriggers[triggerKey];
    if (!triggerSettings.inApp && !triggerSettings.email) {
      return; // No channels enabled
    }

    // Find admins to notify
    const admins = await User.find({
      $or: [
        { agencyId: companyId },
        { brandId: companyId }
      ],
      role: { $in: ["agency_super_admin", "commander_admin", "brand_super_admin"] },
      isActive: true
    });

    if (!admins.length) return;

    // Create in-app notifications
    if (triggerSettings.inApp) {
      const notifications = admins.map(admin => ({
        userId: admin._id,
        type,
        title,
        message,
        metadata,
        channels: { inApp: true, email: triggerSettings.email, whatsapp: triggerSettings.whatsapp }
      }));
      
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Error dispatching system notification:", err);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  dispatchSystemNotification,
};
