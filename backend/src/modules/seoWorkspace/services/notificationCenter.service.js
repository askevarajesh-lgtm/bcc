const WorkspaceNotification = require('../models/workspaceNotification.model');
const secretVault = require('./secretVault.service');
const actionNotification = require('./nodes/action.notifications');
const logger = require('../../aiCore/logger.service');

class NotificationCenterService {
  /**
   * Dispatch a notification across configured channels and save to in-app notification center
   */
  async notify(projectId, {
    title,
    message,
    severity = 'info',
    category = 'automation',
    channels = ['in_app'],
    userId = null,
    actionUrl = null,
    metadata = {}
  }) {
    const deliveryLogs = [{ channel: 'in_app', status: 'delivered', deliveredAt: new Date() }];

    const notif = new WorkspaceNotification({
      projectId,
      userId,
      title,
      message,
      severity,
      category,
      isRead: false,
      actionUrl,
      metadata,
      deliveryLogs
    });

    // Deliver to external channels if requested
    for (const ch of channels) {
      if (ch === 'in_app') continue;

      try {
        await actionNotification.execute({
          channel: ch,
          title,
          message,
          severity,
          credentialName: ch
        }, { projectId });

        notif.deliveryLogs.push({
          channel: ch,
          status: 'delivered',
          deliveredAt: new Date()
        });
      } catch (err) {
        logger.warn('NotificationCenter', `Delivery failed for channel ${ch}: ${err.message}`);
        notif.deliveryLogs.push({
          channel: ch,
          status: 'failed',
          deliveredAt: new Date(),
          error: err.message
        });
      }
    }

    await notif.save();
    return notif;
  }

  /**
   * List notifications with filtering and pagination
   */
  async listNotifications(projectId, { page = 1, limit = 30, isRead, severity, category }) {
    const filter = { projectId };
    if (isRead !== undefined) filter.isRead = isRead === 'true' || isRead === true;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await WorkspaceNotification.countDocuments(filter);
    const unreadCount = await WorkspaceNotification.countDocuments({ projectId, isRead: false });

    const items = await WorkspaceNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      items,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(projectId, notificationId) {
    const notif = await WorkspaceNotification.findOneAndUpdate(
      { _id: notificationId, projectId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) throw new Error('Notification not found');
    return notif;
  }

  /**
   * Mark all notifications as read for project
   */
  async markAllAsRead(projectId) {
    const result = await WorkspaceNotification.updateMany(
      { projectId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return { updatedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(projectId, notificationId) {
    const result = await WorkspaceNotification.findOneAndDelete({ _id: notificationId, projectId });
    if (!result) throw new Error('Notification not found');
    return { success: true, deletedId: notificationId };
  }

  /**
   * Generate an automated periodic SEO Digest
   */
  async generateDigest(projectId, digestType = 'daily') {
    const WorkspaceMonitoringAlert = require('../models/workspaceMonitoringAlert.model');
    const AutomationExecutionRun = require('../models/automationExecutionRun.model');
    const WorkspaceKeyword = require('../models/workspaceKeyword.model');

    const sinceDate = new Date();
    if (digestType === 'daily') sinceDate.setDate(sinceDate.getDate() - 1);
    else if (digestType === 'weekly') sinceDate.setDate(sinceDate.getDate() - 7);
    else sinceDate.setMonth(sinceDate.getMonth() - 1);

    const [alertCount, criticalAlerts, workflowRuns, improvedKeywords, droppedKeywords] = await Promise.all([
      WorkspaceMonitoringAlert.countDocuments({ projectId, createdAt: { $gte: sinceDate } }),
      WorkspaceMonitoringAlert.countDocuments({ projectId, severity: 'critical', createdAt: { $gte: sinceDate } }),
      AutomationExecutionRun.countDocuments({ projectId, createdAt: { $gte: sinceDate } }),
      WorkspaceKeyword.countDocuments({ projectId, rankGain: { $gt: 0 } }),
      WorkspaceKeyword.countDocuments({ projectId, rankGain: { $lt: 0 } })
    ]);

    const title = `SEO Workspace ${digestType.toUpperCase()} Digest`;
    const message = `Digest Summary:
• Total Monitoring Alerts: ${alertCount} (${criticalAlerts} Critical)
• Automation Runs Executed: ${workflowRuns}
• Keywords Gaining: ${improvedKeywords} | Keywords Dropping: ${droppedKeywords}`;

    return this.notify(projectId, {
      title,
      message,
      severity: criticalAlerts > 0 ? 'warning' : 'info',
      category: 'digest',
      metadata: {
        digestType,
        stats: { alertCount, criticalAlerts, workflowRuns, improvedKeywords, droppedKeywords }
      }
    });
  }
}

module.exports = new NotificationCenterService();
