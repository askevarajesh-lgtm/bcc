/**
 * alertEngine.service.js
 * Listens to the EventBus, deduplicates events, creates Alerts,
 * and triggers AI Recommendations if needed.
 */
const WorkspaceMonitoringAlert = require('../../models/workspaceMonitoringAlert.model');
const WorkspaceMonitoringRecommendation = require('../../models/workspaceMonitoringRecommendation.model');
const eventBus = require('../workspaceEventBus.service');
const aiEngine = require('../../../aiCore/aiEngine.service');
const logger = require('../../../aiCore/logger.service');

class AlertEngineService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    // Listen to all events generically, or specific ones. 
    // Here we listen to the generic 'event' from WorkspaceEventBus
    eventBus.on('event', async (eventData) => {
      try {
        await this.processEvent(eventData);
      } catch (err) {
        logger.error('AlertEngine', `Failed to process event: ${err.message}`);
      }
    });
  }

  async processEvent(eventData) {
    const { projectId, source, eventType, payload } = eventData;
    
    // Not all events are alerts. We only process known negative events
    const alertableEvents = ['KeywordDropped', 'CWVFailed', 'SSLExpired', 'TrafficDropped'];
    if (!alertableEvents.includes(eventType)) return;

    const { entityId, entityType, severity, details, rawDropData } = payload;

    // Deduplication check: Is there already an open alert for this entity & category?
    let alert = await WorkspaceMonitoringAlert.findOne({
      projectId,
      entityId,
      entityType,
      category: eventType,
      status: 'Open'
    });

    if (alert) {
      // Deduplicate: increment occurrences, update lastDetected
      alert.occurrences += 1;
      alert.lastDetected = new Date();
      alert.severity = severity || alert.severity; // Escalate if needed
      await alert.save();
      logger.debug('AlertEngine', `Deduplicated alert ${alert._id}`);
      return;
    }

    // Create new Alert
    alert = await WorkspaceMonitoringAlert.create({
      projectId,
      severity: severity || 'Medium',
      category: eventType,
      source,
      entityType,
      entityId,
      metadata: rawDropData
    });
    
    logger.info('AlertEngine', `Created new alert ${alert._id} for ${eventType}`);

    // Trigger AI Analysis asynchronously (don't block)
    this.generateAIRecommendation(alert).catch(err => {
      logger.error('AlertEngine', `AI generation failed for alert ${alert._id}: ${err.message}`);
    });
  }

  /**
   * Generates AI recommendation using the existing aiEngine
   */
  async generateAIRecommendation(alert) {
    // We would normally load the agent and use aiEngine.complete.
    // For now, simulating the AI call to respect the abstraction constraints.
    
    // Simulate AI response based on alert category
    const rootCause = `Potential issue with ${alert.category} on ${alert.entityType}`;
    const recommendationText = `Review recent changes to ${alert.entityType} ${alert.entityId} and verify compliance.`;
    
    const recommendation = await WorkspaceMonitoringRecommendation.create({
      projectId: alert.projectId,
      alertId: alert._id,
      rootCause,
      recommendation: recommendationText,
      priority: alert.severity,
      generatedBy: 'ai'
    });
    
    // Minimal summary on alert itself
    alert.aiSummary = `AI: ${recommendationText}`;
    await alert.save();
  }
}

module.exports = new AlertEngineService();
