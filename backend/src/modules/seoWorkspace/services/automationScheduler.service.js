const WorkspaceSchedule = require('../models/workspaceSchedule.model');
const automationExecution = require('./automationExecution.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationScheduler';

class AutomationSchedulerService {
  /**
   * Create or update a schedule
   */
  async saveSchedule(projectId, data) {
    let schedule;
    if (data._id) {
      schedule = await WorkspaceSchedule.findOne({ _id: data._id, projectId });
      if (!schedule) throw new Error('Schedule not found');
    } else {
      schedule = new WorkspaceSchedule({ projectId });
    }

    schedule.workflowId = data.workflowId || schedule.workflowId;
    schedule.name = data.name || schedule.name;
    schedule.enabled = data.enabled !== undefined ? data.enabled : schedule.enabled;
    schedule.scheduleType = data.scheduleType || schedule.scheduleType;
    schedule.cronExpression = data.cronExpression || schedule.cronExpression;
    schedule.intervalMinutes = data.intervalMinutes !== undefined ? Number(data.intervalMinutes) : schedule.intervalMinutes;
    schedule.specificDate = data.specificDate ? new Date(data.specificDate) : schedule.specificDate;
    schedule.timezone = data.timezone || schedule.timezone;
    schedule.businessHoursOnly = data.businessHoursOnly !== undefined ? data.businessHoursOnly : schedule.businessHoursOnly;
    schedule.businessStartHour = data.businessStartHour !== undefined ? Number(data.businessStartHour) : schedule.businessStartHour;
    schedule.businessEndHour = data.businessEndHour !== undefined ? Number(data.businessEndHour) : schedule.businessEndHour;
    schedule.businessDays = data.businessDays || schedule.businessDays;
    schedule.blackoutWindows = data.blackoutWindows || schedule.blackoutWindows;
    schedule.metadata = data.metadata || schedule.metadata;

    schedule.nextRunAt = this.calculateNextRun(schedule);
    await schedule.save();

    return schedule;
  }

  /**
   * List schedules for project
   */
  async listSchedules(projectId, { page = 1, limit = 50, workflowId, enabled }) {
    const filter = { projectId };
    if (workflowId) filter.workflowId = workflowId;
    if (enabled !== undefined) filter.enabled = enabled === 'true' || enabled === true;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await WorkspaceSchedule.countDocuments(filter);
    const items = await WorkspaceSchedule.find(filter)
      .populate('workflowId', 'name status triggerType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(projectId, scheduleId) {
    const result = await WorkspaceSchedule.findOneAndDelete({ _id: scheduleId, projectId });
    if (!result) throw new Error('Schedule not found');
    return { success: true, deletedId: scheduleId };
  }

  /**
   * Toggle enabled state
   */
  async toggleSchedule(projectId, scheduleId, enabled) {
    const schedule = await WorkspaceSchedule.findOne({ _id: scheduleId, projectId });
    if (!schedule) throw new Error('Schedule not found');

    schedule.enabled = enabled;
    schedule.nextRunAt = enabled ? this.calculateNextRun(schedule) : null;
    await schedule.save();

    return schedule;
  }

  /**
   * Trigger schedule immediately
   */
  async triggerNow(projectId, scheduleId) {
    const schedule = await WorkspaceSchedule.findOne({ _id: scheduleId, projectId });
    if (!schedule) throw new Error('Schedule not found');

    logger.info(TAG, `Manually executing schedule ${schedule.name} (${schedule._id})`);
    
    const run = await automationExecution.runWorkflow(projectId, schedule.workflowId, {
      triggeredBy: 'SchedulerManualTrigger',
      scheduleId: schedule._id.toString()
    });

    schedule.lastRunAt = new Date();
    schedule.runCount = (schedule.runCount || 0) + 1;
    schedule.lastRunStatus = run.status === 'Succeeded' ? 'success' : 'failed';
    schedule.nextRunAt = this.calculateNextRun(schedule);
    await schedule.save();

    return { run, schedule };
  }

  /**
   * Main cron tick evaluator (called periodically by system worker)
   */
  async processDueSchedules() {
    const now = new Date();
    const dueSchedules = await WorkspaceSchedule.find({
      enabled: true,
      nextRunAt: { $lte: now }
    }).limit(25);

    for (const sched of dueSchedules) {
      // Check blackout windows
      if (this._isInBlackout(sched, now)) {
        logger.info(TAG, `Schedule ${sched.name} skipped: Active blackout window`);
        sched.lastRunStatus = 'skipped_blackout';
        sched.nextRunAt = this.calculateNextRun(sched);
        await sched.save();
        continue;
      }

      // Check business hours
      if (sched.businessHoursOnly && !this._isWithinBusinessHours(sched, now)) {
        logger.info(TAG, `Schedule ${sched.name} postponed: Outside business hours`);
        sched.nextRunAt = new Date(now.getTime() + 15 * 60000); // Check again in 15 mins
        await sched.save();
        continue;
      }

      try {
        await automationExecution.runWorkflow(sched.projectId, sched.workflowId, {
          triggeredBy: 'SchedulerCron',
          scheduleId: sched._id.toString()
        });

        sched.lastRunAt = now;
        sched.runCount = (sched.runCount || 0) + 1;
        sched.consecutiveFailures = 0;
        sched.lastRunStatus = 'success';
      } catch (err) {
        logger.error(TAG, `Scheduled run failed for ${sched.name}: ${err.message}`);
        sched.consecutiveFailures = (sched.consecutiveFailures || 0) + 1;
        sched.lastRunStatus = 'failed';
      }

      sched.nextRunAt = this.calculateNextRun(sched);
      await sched.save();
    }
  }

  /**
   * Calculate next run date
   */
  calculateNextRun(schedule) {
    const now = new Date();
    if (!schedule.enabled) return null;

    if (schedule.scheduleType === 'interval') {
      const minutes = Math.max(Number(schedule.intervalMinutes) || 60, 1);
      return new Date(now.getTime() + minutes * 60000);
    }

    if (schedule.scheduleType === 'calendar_once') {
      if (schedule.specificDate && new Date(schedule.specificDate) > now) {
        return new Date(schedule.specificDate);
      }
      return null; // Expired one-off
    }

    // Default cron approximation: Next hour or tomorrow based on hour
    const next = new Date(now.getTime() + 60 * 60000);
    return next;
  }

  _isInBlackout(sched, date) {
    if (!Array.isArray(sched.blackoutWindows)) return false;
    return sched.blackoutWindows.some(w => {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      return date >= start && date <= end;
    });
  }

  _isWithinBusinessHours(sched, date) {
    const day = date.getUTCDay(); // 0 is Sunday
    const hour = date.getUTCHours();

    const allowedDays = sched.businessDays || [1, 2, 3, 4, 5];
    if (!allowedDays.includes(day)) return false;

    const start = sched.businessStartHour !== undefined ? sched.businessStartHour : 9;
    const end = sched.businessEndHour !== undefined ? sched.businessEndHour : 17;
    return hour >= start && hour < end;
  }
}

module.exports = new AutomationSchedulerService();
