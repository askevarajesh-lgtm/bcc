/**
 * alertEngine.service.js
 * Listens to the EventBus, deduplicates events, creates Alerts,
 * and triggers automated AI Root Cause Analysis via aiEngine.
 */
const WorkspaceMonitoringAlert = require('../../models/workspaceMonitoringAlert.model');
const WorkspaceMonitoringRecommendation = require('../../models/workspaceMonitoringRecommendation.model');
const eventBus = require('../workspaceEventBus.service');
const aiEngine = require('../../../aiCore/aiEngine.service');
const logger = require('../../../aiCore/logger.service');

const TAG = 'AlertEngine';

class AlertEngineService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    eventBus.on('event', async (eventData) => {
      try {
        await this.processEvent(eventData);
      } catch (err) {
        logger.error(TAG, `Failed to process event: ${err.message}`);
      }
    });
  }

  async processEvent(eventData) {
    const { projectId, source, eventType, payload = {} } = eventData;
    
    const alertableEvents = [
      'KeywordDropped',
      'OrganicTrafficAnomaly',
      'CompetitorRankOvertake',
      'CriticalCrawlIssuesFound',
      'CWVDegraded',
      'EndpointDowntime',
      'SSLInvalid',
      'SSLExpiryWarning',
      'RobotsBlocksAllCrawlers',
      'SitemapInaccessible',
      'IndexationErrorsDetected',
      'LowAIVisibilityAlert'
    ];

    if (!alertableEvents.includes(eventType)) return;

    const { entityId = eventType, entityType = 'System', severity = 'Medium', details = '', rawDropData = {} } = payload;

    // Deduplication check: Is there already an open alert for this entity & category?
    let alert = await WorkspaceMonitoringAlert.findOne({
      projectId,
      category: eventType,
      status: 'Open'
    });

    if (alert) {
      alert.occurrences = (alert.occurrences || 1) + 1;
      alert.lastDetected = new Date();
      if (severity === 'Critical' || (severity === 'High' && alert.severity !== 'Critical')) {
        alert.severity = severity;
      }
      await alert.save();
      logger.debug(TAG, `Deduplicated alert ${alert._id}`);
      return;
    }

    // Create new Alert
    alert = await WorkspaceMonitoringAlert.create({
      projectId,
      severity,
      category: eventType,
      source,
      entityType,
      entityId: String(entityId),
      metadata: { details, ...rawDropData }
    });
    
    logger.info(TAG, `Created new alert ${alert._id} for ${eventType}`);

    // Trigger AI Root-Cause Analysis
    this.generateAIRecommendation(alert, details).catch(err => {
      logger.error(TAG, `AI generation failed for alert ${alert._id}: ${err.message}`);
    });
  }

  /**
   * Generates AI recommendation using real aiEngine
   */
  async generateAIRecommendation(alert, details = '') {
    const prompt = `As an Enterprise SEO & Technical Monitoring Expert, analyze this monitoring alert and provide root cause diagnosis and high-priority remediation steps:

Alert Category: ${alert.category}
Severity: ${alert.severity}
Entity: ${alert.entityType} (${alert.entityId})
Details: ${details || JSON.stringify(alert.metadata || {})}

Return STRICT JSON:
{
  "rootCause": "Clear 1-2 sentence explanation of the technical root cause",
  "recommendation": "Step-by-step actionable remediation instructions",
  "estimatedImpact": "High | Medium | Low",
  "recommendedAction": "e.g. Inspect canonical tag, rollback recent deploy, contact host"
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: alert.projectId,
        projectId: alert.projectId,
        agentKey: 'monitoringAiAnalyzer',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.2
      });

      const parsed = JSON.parse(response);

      await WorkspaceMonitoringRecommendation.create({
        projectId: alert.projectId,
        alertId: alert._id,
        rootCause: parsed.rootCause || `Issue with ${alert.category}`,
        recommendation: parsed.recommendation || 'Review configuration',
        priority: alert.severity,
        generatedBy: 'ai',
        metadata: { estimatedImpact: parsed.estimatedImpact, recommendedAction: parsed.recommendedAction }
      });
      
      alert.aiSummary = parsed.rootCause;
      await alert.save();
    } catch (err) {
      logger.warn(TAG, `AI analysis fallback used: ${err.message}`);
      await WorkspaceMonitoringRecommendation.create({
        projectId: alert.projectId,
        alertId: alert._id,
        rootCause: `Detected ${alert.category} threshold violation`,
        recommendation: `Inspect ${alert.entityType} settings and verify server telemetry.`,
        priority: alert.severity,
        generatedBy: 'system'
      });
    }
  }
}

module.exports = new AlertEngineService();
