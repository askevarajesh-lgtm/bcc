const mongoose = require('mongoose');
const monitoringEngine = require('../monitoring/monitoringEngine.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceMonitoringScan = require('../../models/workspaceMonitoringScan.model');
const WorkspaceMonitoringSnapshot = require('../../models/workspaceMonitoringSnapshot.model');
const WorkspaceMonitoringAlert = require('../../models/workspaceMonitoringAlert.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunMonitoringScan';

// Poll for async monitoring scan completion status
async function waitForScanCompletion(scanId, timeoutMs = 300000, intervalMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const scan = await WorkspaceMonitoringScan.findOne({ scanId }).lean();
    if (!scan) break;
    if (scan.status === 'Completed' || scan.status === 'Failed') return scan;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}

module.exports = {
  id: 'run_monitoring_scan',
  name: 'Run Infrastructure & SEO Monitoring Scan',
  category: 'Monitoring & Alerts',
  icon: 'ShieldCheck',
  description: 'Proactively monitors uptime, SSL certificate expiry, Core Web Vitals degradation, DNS health, and search engine index status.',

  documentation: {
    overview: 'Runs automated pulse checks across project infrastructure and dispatches alerts on critical anomalies. Waits for all checks to complete and returns full scan metrics.',
    inputsDoc: [
      { name: 'checkUptime', desc: 'Perform HTTP response code uptime check', type: 'boolean', default: true },
      { name: 'checkSsl', desc: 'Verify SSL certificate validity and expiry dates', type: 'boolean', default: true },
      { name: 'checkCwv', desc: 'Benchmark real user Core Web Vitals against Google standards', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'scanId', desc: 'Unique monitoring scan ID string', type: 'string' },
      { name: 'healthScore', desc: 'Computed project health index score (0-100)', type: 'number' },
      { name: 'uptimeStatus', desc: 'Uptime verification outcome (e.g. UP, DEGRADED, DOWN)', type: 'string' },
      { name: 'responseTimeMs', desc: 'HTTP TTFB response latency', type: 'number' },
      { name: 'sslDaysRemaining', desc: 'Days until SSL cert expiration', type: 'number' },
      { name: 'cwvRating', desc: 'Core Web Vitals overall score classification', type: 'string' },
      { name: 'alertsTriggered', desc: 'Count of new open warning alerts raised during the scan', type: 'number' },
      { name: 'uptime', desc: 'Detailed uptime monitor information', type: 'object' },
      { name: 'ssl', desc: 'Detailed SSL monitor information', type: 'object' },
      { name: 'coreWebVitals', desc: 'Detailed CWV and performance metrics', type: 'object' },
      { name: 'indexStatus', desc: 'Detailed Google Search index coverage stats', type: 'object' },
      { name: 'activeAlerts', desc: 'Array of currently unresolved issues and alerts', type: 'array' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 45000,
  estimatedCost: { apiCalls: 1, aiTokens: 50, thirdPartyCalls: 1 },
  dependencies: [],
  permissions: ['seo:monitoring:run'],

  getInputSchema() {
    return [
      { name: 'checkUptime', label: 'Check HTTP Uptime & Latency', type: 'switch', defaultValue: true },
      { name: 'checkSsl', label: 'Inspect SSL Expiry & TLS Protocols', type: 'switch', defaultValue: true },
      { name: 'checkCwv', label: 'Measure Core Web Vitals (LCP, FID, CLS)', type: 'switch', defaultValue: true },
      { name: 'timeout', label: 'Scan Timeout (seconds)', type: 'number', defaultValue: 120, min: 10, max: 300 }
    ];
  },

  getOutputSchema() {
    return {
      scanId: { type: 'string', description: 'Unique monitoring scan ID' },
      healthScore: { type: 'number', description: 'Computed health index score' },
      uptimeStatus: { type: 'string', description: 'Uptime check status' },
      responseTimeMs: { type: 'number', description: 'Latency TTFB in milliseconds' },
      sslDaysRemaining: { type: 'number', description: 'SSL days left before expiration' },
      cwvRating: { type: 'string', description: 'Core Web Vitals overall score' },
      alertsTriggered: { type: 'number', description: 'Open alerts count' },
      uptime: { type: 'object', description: 'Uptime diagnostics' },
      ssl: { type: 'object', description: 'SSL diagnostics' },
      coreWebVitals: { type: 'object', description: 'CWV diagnostics' },
      indexStatus: { type: 'object', description: 'Google Index diagnostics' },
      activeAlerts: { type: 'array', description: 'Unresolved alerts raised' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Monitoring scan for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found.' };
    }

    if (context.isSimulation) {
      return {
        success: true,
        scanId: `sim_scan_${Date.now()}`,
        healthScore: 95,
        uptimeStatus: 'UP (200 OK)',
        responseTimeMs: 142,
        sslDaysRemaining: 74,
        cwvRating: 'GOOD',
        alertsTriggered: 0,
        uptime: {},
        ssl: {},
        coreWebVitals: {},
        indexStatus: {},
        activeAlerts: []
      };
    }

    // --- Trigger manual scan via monitoringEngine orchestrator ---
    let triggerResult = null;
    try {
      triggerResult = await monitoringEngine.runScan(projectId, { priority: 10 });
    } catch (err) {
      logger.warn(TAG, `Monitoring engine runScan start error: ${err.message}`);
    }

    const scanId = triggerResult ? triggerResult.scanId : null;

    // --- Wait for the scan task to complete ---
    if (scanId) {
      logger.info(TAG, `Monitoring scan ${scanId} triggered. Polling status...`);
      await waitForScanCompletion(scanId, (Number(config.timeout) || 120) * 1000);
    }

    // --- Query the latest completed Snapshot snapshot for full metrics ---
    const snapshot = await WorkspaceMonitoringSnapshot.findOne({ projectId }).sort({ timestamp: -1 }).lean();

    if (!snapshot) {
      return {
        success: false,
        error: 'Monitoring scan execution completed but no snapshot data was generated.',
        scanId
      };
    }

    // Fetch active alerts for this project
    const activeAlerts = await WorkspaceMonitoringAlert.find({ projectId, status: 'Open' }).lean();

    // Map metrics from snapshot
    const uptimeData = snapshot.uptime || {};
    const sslData = snapshot.ssl || {};
    const cwvData = snapshot.coreWebVitals || {};
    const indexData = snapshot.indexStatus || {};

    const uptimeStatus = uptimeData.status === 'up' ? 'UP (200 OK)' : (uptimeData.status === 'down' ? 'DOWN' : 'DEGRADED');
    const responseTimeMs = uptimeData.responseTime || 0;
    const sslDaysRemaining = sslData.daysRemaining || 0;
    const cwvRating = cwvData.overallScore >= 90 ? 'GOOD' : (cwvData.overallScore >= 50 ? 'NEEDS IMPROVEMENT' : 'POOR');

    return {
      success: true,
      scanId: scanId || `snapshot-${snapshot._id}`,
      healthScore: snapshot.healthScore ?? 100,
      uptimeStatus,
      responseTimeMs,
      sslDaysRemaining,
      cwvRating,
      alertsTriggered: activeAlerts.length,
      uptime: {
        status: uptimeData.status || 'unknown',
        responseTime: responseTimeMs,
        lastChecked: uptimeData.lastChecked || null
      },
      ssl: {
        isValid: sslData.isValid ?? false,
        daysRemaining: sslDaysRemaining,
        issuer: sslData.issuer || '',
        expiryDate: sslData.expiryDate || null
      },
      coreWebVitals: {
        overallScore: cwvData.overallScore || 0,
        lcp: cwvData.lcp || 0,
        fid: cwvData.fid || 0,
        cls: cwvData.cls || 0,
        lastAudited: cwvData.lastAudited || null
      },
      indexStatus: {
        indexedPages: indexData.indexedPages || 0,
        coverageErrors: indexData.coverageErrors || 0,
        lastCrawled: indexData.lastCrawled || null
      },
      activeAlerts: activeAlerts.map(a => ({
        alertId: a._id.toString(),
        type: a.type,
        severity: a.severity,
        message: a.message,
        metric: a.metric,
        lastDetected: a.lastDetected ? new Date(a.lastDetected).toISOString() : null
      }))
    };
  }
};
