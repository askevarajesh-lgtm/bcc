/**
 * monitoringEngine.service.js
 * Central orchestrator implementing a deterministic scan pipeline.
 * Runs all 11 enterprise monitoring plugins with health score updates.
 */
const { WorkspaceMonitoringScan } = require('../../models/workspaceMonitoringAsset.model');
const WorkspaceProject = require('../../models/workspaceProject.model');
const executionQueue = require('../../../aiCore/executionQueue.service');
const registry = require('./MonitoringRegistry');
const eventBus = require('../workspaceEventBus.service');
const logger = require('../../../aiCore/logger.service');

// Import all 11 Monitoring Plugins
const KeywordMonitor = require('./KeywordMonitor');
const TrafficMonitor = require('./monitors/TrafficMonitor');
const CompetitorMonitor = require('./monitors/CompetitorMonitor');
const CrawlMonitor = require('./monitors/CrawlMonitor');
const CWVMonitor = require('./monitors/CWVMonitor');
const UptimeMonitor = require('./monitors/UptimeMonitor');
const SSLMonitor = require('./monitors/SSLMonitor');
const RobotsMonitor = require('./monitors/RobotsMonitor');
const SitemapMonitor = require('./monitors/SitemapMonitor');
const IndexCoverageMonitor = require('./monitors/IndexCoverageMonitor');
const AIVisibilityMonitor = require('./monitors/AIVisibilityMonitor');

// Register all monitors
registry.register(new KeywordMonitor());
registry.register(new TrafficMonitor());
registry.register(new CompetitorMonitor());
registry.register(new CrawlMonitor());
registry.register(new CWVMonitor());
registry.register(new UptimeMonitor());
registry.register(new SSLMonitor());
registry.register(new RobotsMonitor());
registry.register(new SitemapMonitor());
registry.register(new IndexCoverageMonitor());
registry.register(new AIVisibilityMonitor());

class MonitoringEngineService {
  
  /**
   * Triggers a new manual or cron scan. Uses queue to prevent overlaps.
   */
  async runScan(projectId, options = {}) {
    const project = await WorkspaceProject.findById(projectId);
    if (!project) throw new Error('Project not found');

    const key = `monitoring-scan:${projectId}`;

    if (executionQueue.isBusy(key)) {
      const activeScan = await WorkspaceMonitoringScan.findOne({
        projectId,
        status: { $in: ['Queued', 'Running', 'Paused', 'Retrying'] }
      }).sort({ createdAt: -1 });

      return {
        alreadyRunning: true,
        scanId: activeScan ? activeScan.scanId : 'unknown',
        status: activeScan ? activeScan.status : 'Running',
        progress: activeScan ? activeScan.progress : 0
      };
    }

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    await WorkspaceMonitoringScan.create({
      projectId,
      scanId,
      status: 'Queued',
      progress: 0,
    });

    executionQueue.enqueue({
      key,
      taskId: scanId,
      priority: options.priority || 5,
      retries: 2,
      fn: () => this._executeScanPipeline(projectId, scanId, project)
    }).catch(err => {
      logger.error('MonitoringEngine', `Scan failed: ${err.message}`);
    });

    return {
      alreadyRunning: false,
      scanId,
      status: 'Queued',
      progress: 0
    };
  }

  /**
   * The actual deterministic pipeline execution
   */
  async _executeScanPipeline(projectId, scanId, project) {
    const scan = await WorkspaceMonitoringScan.findOne({ scanId });
    if (!scan) throw new Error('Scan record not found');

    scan.status = 'Running';
    scan.startedAt = new Date();
    await scan.save();

    const monitors = registry.getAllMonitors();
    let progress = 0;
    const progressStep = 90 / (monitors.length || 1);
    
    let previousSnapshot = null;
    const { WorkspaceMonitoringSnapshot: SnapshotModel } = require('../../models/workspaceMonitoringAsset.model');
    const lastSnapshot = await SnapshotModel.findOne({ projectId }).sort({ timestamp: -1 });
    if (lastSnapshot) previousSnapshot = lastSnapshot.toObject();

    const pipelineContext = { projectId, project, scanId, previousSnapshot };
    const allEvents = [];
    const overallHealthImpact = {};
    const normalizedResults = {};

    try {
      for (const monitor of monitors) {
        logger.info('MonitoringEngine', `Running monitor: ${monitor.name}`);
        
        try {
          const result = await monitor.runLifecycle(pipelineContext);
          normalizedResults[monitor.name] = result.normalizedData;
          
          if (Array.isArray(result.events)) {
            allEvents.push(...result.events);
          }
          
          for (const [key, value] of Object.entries(result.healthImpact || {})) {
            overallHealthImpact[key] = (overallHealthImpact[key] || 0) + value;
          }
        } catch (err) {
          logger.error('MonitoringEngine', `Monitor ${monitor.name} encountered error: ${err.message}`);
        }

        progress += progressStep;
        await WorkspaceMonitoringScan.updateOne({ scanId }, { $set: { progress: Math.min(Math.round(progress), 90) } });
      }

      // Dispatch all generated events to EventBus
      for (const event of allEvents) {
        try {
          eventBus.dispatch(event);
        } catch (e) {
          logger.warn('MonitoringEngine', `Event dispatch error: ${e.message}`);
        }
      }
      
      // Build final Snapshot
      const snapshotBuilder = require('./snapshotBuilder.service');
      await snapshotBuilder.buildSnapshot(projectId, normalizedResults, overallHealthImpact);

      await WorkspaceMonitoringScan.updateOne({ scanId }, { 
        $set: { 
          status: 'Completed', 
          progress: 100, 
          finishedAt: new Date(),
          durationMs: Date.now() - scan.startedAt.getTime(),
          resultsSummary: { eventsFired: allEvents.length, monitorsExecuted: monitors.length }
        } 
      });

      return { status: 'Completed', eventsCount: allEvents.length };
      
    } catch (error) {
      await WorkspaceMonitoringScan.updateOne({ scanId }, { 
        $set: { 
          status: 'Failed', 
          error: error.message,
          finishedAt: new Date(),
          durationMs: Date.now() - scan.startedAt.getTime()
        } 
      });
      throw error;
    }
  }

  async getScanStatus(scanId) {
    return WorkspaceMonitoringScan.findOne({ scanId }).lean();
  }
}

module.exports = new MonitoringEngineService();
