const AutomationWorkflow = require('../models/automationWorkflow.model');
const AutomationExecutionRun = require('../models/automationExecutionRun.model');
const AutomationExecutionNodeLog = require('../models/automationExecutionNodeLog.model');
const WorkspaceSchedule = require('../models/workspaceSchedule.model');
const queue = require('../../aiCore/executionQueue.service');

class AutomationAnalyticsController {
  async getOverview(req, res) {
    try {
      const { projectId } = req.params;
      const { timeRange = '30d' } = req.query;

      const sinceDate = new Date();
      if (timeRange === '7d') sinceDate.setDate(sinceDate.getDate() - 7);
      else if (timeRange === '90d') sinceDate.setDate(sinceDate.getDate() - 90);
      else sinceDate.setDate(sinceDate.getDate() - 30);

      const [totalWorkflows, activeWorkflows, totalRuns, successfulRuns, failedRuns, schedulesCount] = await Promise.all([
        AutomationWorkflow.countDocuments({ projectId }),
        AutomationWorkflow.countDocuments({ projectId, status: 'Published' }),
        AutomationExecutionRun.countDocuments({ projectId, createdAt: { $gte: sinceDate } }),
        AutomationExecutionRun.countDocuments({ projectId, status: 'Succeeded', createdAt: { $gte: sinceDate } }),
        AutomationExecutionRun.countDocuments({ projectId, status: 'Failed', createdAt: { $gte: sinceDate } }),
        WorkspaceSchedule.countDocuments({ projectId, enabled: true })
      ]);

      const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

      // Calculate avg duration
      const avgDurationAgg = await AutomationExecutionRun.aggregate([
        { $match: { projectId: new (require('mongoose').Types.ObjectId)(projectId), durationMs: { $ne: null }, createdAt: { $gte: sinceDate } } },
        { $group: { _id: null, avgDuration: { $avg: '$durationMs' }, p95Duration: { $max: '$durationMs' } } }
      ]);

      const avgDurationMs = avgDurationAgg[0] ? Math.round(avgDurationAgg[0].avgDuration) : 0;
      const p95DurationMs = avgDurationAgg[0] ? Math.round(avgDurationAgg[0].p95Duration) : 0;

      // Daily timeline
      const timeline = await AutomationExecutionRun.aggregate([
        { $match: { projectId: new (require('mongoose').Types.ObjectId)(projectId), createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            succeeded: { $sum: { $cond: [{ $eq: ['$status', 'Succeeded'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Slowest nodes
      const slowNodes = await AutomationExecutionNodeLog.aggregate([
        { $match: { durationMs: { $ne: null } } },
        {
          $group: {
            _id: '$nodeName',
            avgDuration: { $avg: '$durationMs' },
            executions: { $sum: 1 },
            failures: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } }
          }
        },
        { $sort: { avgDuration: -1 } },
        { $limit: 10 }
      ]);

      const queueMetrics = queue.getMetrics();

      res.json({
        success: true,
        summary: {
          totalWorkflows,
          activeWorkflows,
          totalRuns,
          successfulRuns,
          failedRuns,
          successRate,
          avgDurationMs,
          p95DurationMs,
          activeSchedules: schedulesCount,
          queueStatus: queueMetrics
        },
        timeline,
        slowNodes
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AutomationAnalyticsController();
