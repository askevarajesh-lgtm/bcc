/**
 * snapshotBuilder.service.js
 * Compiles the Read-Only MonitoringSnapshot based on normalized monitor data.
 */
const WorkspaceMonitoringSnapshot = require('../../models/workspaceMonitoringSnapshot.model');
const WorkspaceMonitoringAlert = require('../../models/workspaceMonitoringAlert.model');
const WorkspaceMonitoringSettings = require('../../models/workspaceMonitoringSettings.model');

class SnapshotBuilderService {
  /**
   * Generates a new snapshot.
   * @param {string} projectId 
   * @param {Object} normalizedDataMap Map of MonitorName -> NormalizedData
   * @param {Object} healthImpactMap Map of Health Category -> impact score delta
   */
  async buildSnapshot(projectId, normalizedDataMap, healthImpactMap) {
    // Calculate Health Score
    let settings = await WorkspaceMonitoringSettings.findOne({ projectId }).lean();
    if (!settings) {
      settings = {
        healthWeights: { technicalSeo: 20, performance: 20, indexability: 15, traffic: 15, ranking: 20, alerts: 10 }
      };
    }

    // Default base scores
    let technicalSeo = 100 + (healthImpactMap.technicalSeo || 0);
    let performance = 100 + (healthImpactMap.performance || 0);
    let indexability = 100 + (healthImpactMap.indexability || 0);
    let traffic = 100 + (healthImpactMap.traffic || 0);
    let ranking = 100 + (healthImpactMap.ranking || 0);

    // Ensure within 0-100
    technicalSeo = Math.max(0, Math.min(100, technicalSeo));
    performance = Math.max(0, Math.min(100, performance));
    indexability = Math.max(0, Math.min(100, indexability));
    traffic = Math.max(0, Math.min(100, traffic));
    ranking = Math.max(0, Math.min(100, ranking));

    const w = settings.healthWeights;
    let baseScore = (
      (technicalSeo * (w.technicalSeo / 100)) +
      (performance * (w.performance / 100)) +
      (indexability * (w.indexability / 100)) +
      (traffic * (w.traffic / 100)) +
      (ranking * (w.ranking / 100))
    );

    // Apply alert deductions
    const openAlertsCount = await WorkspaceMonitoringAlert.countDocuments({ projectId, status: 'Open' });
    const criticalAlertsCount = await WorkspaceMonitoringAlert.countDocuments({ projectId, status: 'Open', severity: 'Critical' });
    
    // Deduct based on alerts
    const alertDeduction = Math.min(w.alerts, (criticalAlertsCount * 2) + (openAlertsCount * 0.5));
    const healthScore = Math.max(0, Math.round(baseScore - alertDeduction));

    // Construct Snapshot
    const snapshot = await WorkspaceMonitoringSnapshot.create({
      projectId,
      timestamp: new Date(),
      healthScore,
      keywordSummary: normalizedDataMap['KeywordMonitor'] || {},
      trafficSummary: normalizedDataMap['TrafficMonitor'] || {},
      competitorSummary: normalizedDataMap['CompetitorMonitor'] || {},
      alerts: {
        totalOpen: openAlertsCount,
        critical: criticalAlertsCount
      },
      crawl: normalizedDataMap['CrawlMonitor'] || {},
      coreWebVitals: normalizedDataMap['CWVMonitor'] || {},
      uptime: normalizedDataMap['UptimeMonitor'] || {},
      ssl: normalizedDataMap['SSLMonitor'] || {},
      robots: normalizedDataMap['RobotsMonitor'] || {},
      sitemap: normalizedDataMap['SitemapMonitor'] || {},
      indexStatus: normalizedDataMap['IndexMonitor'] || {},
      aiVisibility: normalizedDataMap['AIVisibilityMonitor'] || {}
    });

    return snapshot;
  }
}

module.exports = new SnapshotBuilderService();
