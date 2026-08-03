const scheduler = require('../services/automationScheduler.service');

class SchedulerController {
  async list(req, res) {
    try {
      const { projectId } = req.params;
      const result = await scheduler.listSchedules(projectId, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async save(req, res) {
    try {
      const { projectId } = req.params;
      const saved = await scheduler.saveSchedule(projectId, req.body);
      res.json({ success: true, schedule: saved });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggle(req, res) {
    try {
      const { projectId, scheduleId } = req.params;
      const { enabled } = req.body;
      const updated = await scheduler.toggleSchedule(projectId, scheduleId, Boolean(enabled));
      res.json({ success: true, schedule: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async triggerNow(req, res) {
    try {
      const { projectId, scheduleId } = req.params;
      const result = await scheduler.triggerNow(projectId, scheduleId);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { projectId, scheduleId } = req.params;
      const result = await scheduler.deleteSchedule(projectId, scheduleId);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SchedulerController();
