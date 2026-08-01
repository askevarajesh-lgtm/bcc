/**
 * monitoringEngine.service.js
 * Central orchestrator implementing a deterministic scan pipeline.
 * Uses `executionQueue` for concurrency, locking, retries.
 */
const WorkspaceMonitoringScan = require('../../models/workspaceMonitoringScan.model');
const WorkspaceProject = require('../../models/workspaceProject.model');
const executionQueue = require('../../../aiCore/executionQueue.service');
const registry = require('./MonitoringRegistry');
const eventBus = require('../workspaceEventBus.service');
const logger = require('../../../aiCore/logger.service');

// Import and register monitors
const KeywordMonitor = require('./KeywordMonitor');
registry.register(new KeywordMonitor());
// Other monitors will be registered here as they are created

class MonitoringEngineService {
  
  /**
   * Triggers a new manual or cron scan. Uses queue to prevent overlaps.
   */
  async runScan(projectId, options = {}) {
    const project = await WorkspaceProject.findById(projectId);
    if (!project) throw new Error('Project not found');

    const key = `monitoring-scan:${projectId}`;

    // Check if already busy in the queue
    if (executionQueue.isBusy(key)) {
      // Find the currently running scan ID to return to the frontend
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
    
    // Create initial state
    await WorkspaceMonitoringScan.create({
      projectId,
      scanId,
      status: 'Queued',
      progress: 0,
    });

    // Enqueue the actual scan
    // We do NOT wait for it to finish here if it's async (like from cron).
    // If we want to return immediately, we just return the scanId.
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
    const progressStep = 100 / (monitors.length + 1); // +1 for Snapshot & Cleanup
    
    let previousSnapshot = null;
    const SnapshotModel = require('../../models/workspaceMonitoringSnapshot.model');
    const lastSnapshot = await SnapshotModel.findOne({ projectId }).sort({ timestamp: -1 });
    if (lastSnapshot) previousSnapshot = lastSnapshot.toObject();

    const pipelineContext = { projectId, project, scanId, previousSnapshot };
    const allEvents = [];
    const overallHealthImpact = {};
    const normalizedResults = {};

    try {
      for (const monitor of monitors) {
        logger.info('MonitoringEngine', `Running monitor: ${monitor.name}`);
        
        const result = await monitor.runLifecycle(pipelineContext);
        
        normalizedResults[monitor.name] = result.normalizedData;
        
        // Aggregate events
        allEvents.push(...result.events);
        
        // Aggregate health impacts
        for (const [key, value] of Object.entries(result.healthImpact || {})) {
          overallHealthImpact[key] = (overallHealthImpact[key] || 0) + value;
        }

        progress += progressStep;
        await WorkspaceMonitoringScan.updateOne({ scanId }, { $set: { progress: Math.min(Math.round(progress), 90) } });
      }

      // Dispatch all generated events to the EventBus
      for (const event of allEvents) {
        eventBus.dispatch(event);
      }
      
      // The EventBus triggers alert generation and other listeners asynchronously.
      // Now trigger the SnapshotBuilder to create the final read-model snapshot.
      const snapshotBuilder = require('./snapshotBuilder.service');
      await snapshotBuilder.buildSnapshot(projectId, normalizedResults, overallHealthImpact);

      // Finish
      await WorkspaceMonitoringScan.updateOne({ scanId }, { 
        $set: { 
          status: 'Completed', 
          progress: 100, 
          finishedAt: new Date(),
          durationMs: Date.now() - scan.startedAt.getTime(),
          resultsSummary: { eventsFired: allEvents.length }
        } 
      });

      return { status: 'Completed' };
      
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
