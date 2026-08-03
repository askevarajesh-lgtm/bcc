const notificationCenter = require('../services/notificationCenter.service');

class NotificationCenterController {
  async list(req, res) {
    try {
      const { projectId } = req.params;
      const result = await notificationCenter.listNotifications(projectId, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { projectId, notificationId } = req.params;
      const updated = await notificationCenter.markAsRead(projectId, notificationId);
      res.json({ success: true, notification: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const { projectId } = req.params;
      const result = await notificationCenter.markAllAsRead(projectId);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { projectId, notificationId } = req.params;
      const result = await notificationCenter.deleteNotification(projectId, notificationId);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async generateDigest(req, res) {
    try {
      const { projectId } = req.params;
      const { digestType } = req.body;
      const result = await notificationCenter.generateDigest(projectId, digestType || 'daily');
      res.json({ success: true, digest: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new NotificationCenterController();
