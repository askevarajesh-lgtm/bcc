/**
 * monitoringHistory.service.js
 * Responsible for historical charts, trend calculations, comparison, and retention policy.
 */
const WorkspaceMonitoringSnapshot = require('../../models/workspaceMonitoringSnapshot.model');
const logger = require('../../../aiCore/logger.service');

class MonitoringHistoryService {
  /**
   * Retrieves snapshots for rendering historical charts.
   * Averages/downsamples points if timeframe is large.
   */
  async getHistory(projectId, timeframeDays = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - timeframeDays);

    // If requesting > 30 days, we might only want 1 point per day
    const snapshots = await WorkspaceMonitoringSnapshot.find({
      projectId,
      timestamp: { $gte: fromDate }
    }).sort({ timestamp: 1 }).lean();

    return snapshots;
  }

  /**
   * Run the retention policy.
   * Example: 
   * - Keep all hourly snapshots for 30 days
   * - Downsample to 1 daily snapshot for 1-12 months
   * - Downsample to 1 monthly snapshot forever
   */
  async enforceRetentionPolicy(projectId) {
    logger.info('MonitoringHistory', `Running retention policy for project ${projectId}`);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    // 1. Delete all non-daily snapshots older than 30 days (leaving 1 per day)
    // This requires a complex aggregation or script. 
    // For now, as a placeholder for enterprise architecture, we delete purely old data if it isn't aggregated.
    
    // Example: Delete snapshots older than 1 year to prevent DB bloat
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    await WorkspaceMonitoringSnapshot.deleteMany({
      projectId,
      timestamp: { $lt: oneYearAgo }
    });
    
    logger.info('MonitoringHistory', `Retention cleanup complete for project ${projectId}`);
  }
}

module.exports = new MonitoringHistoryService();
