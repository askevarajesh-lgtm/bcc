/**
 * workspaceEventBus.service.js
 * Central Event Bus for the entire SEO Workspace.
 * Emits events from Monitoring (and other modules) to be consumed by:
 * - Alert Engine
 * - Notification Engine
 * - Snapshot Builder
 * - Timeline / Audit Logs
 * - Automation Trigger Registry
 */
const EventEmitter = require('events');
const logger = require('../../aiCore/logger.service');

// Optional: Import the automation event bus to bridge events
const automationEventBus = require('./automationEventBus.service');

const TAG = 'WorkspaceEventBus';

class WorkspaceEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.setupListeners();
  }

  setupListeners() {
    this.on('event', async (eventData) => {
      try {
        await this.handleEvent(eventData);
      } catch (error) {
        logger.error(TAG, `Error handling event: ${error.message}`, { eventData });
      }
    });
  }

  /**
   * Dispatch an event to the Global Event Bus
   * @param {Object} eventData
   * @param {string} eventData.source - e.g., 'KeywordMonitor'
   * @param {string} eventData.projectId
   * @param {string} eventData.eventType - e.g., 'KeywordDropped'
   * @param {Object} [eventData.payload]
   */
  dispatch(eventData) {
    if (!eventData.projectId || !eventData.source || !eventData.eventType) {
      logger.warn(TAG, 'Dispatched event missing required fields (projectId, source, eventType)');
      return;
    }
    
    // Emit locally for synchronous listeners in the same process
    this.emit('event', eventData);
    // Also emit specific event type for targeted listeners
    this.emit(eventData.eventType, eventData);
  }

  async handleEvent(eventData) {
    // 1. Forward to Automation Event Bus (so triggers can fire)
    automationEventBus.dispatch({
      source: eventData.source,
      projectId: eventData.projectId,
      eventType: eventData.eventType,
      payload: eventData.payload
    });
    
    // Alerting and Snapshot building will subscribe to this bus externally.
  }
}

const eventBus = new WorkspaceEventBus();
module.exports = eventBus;
