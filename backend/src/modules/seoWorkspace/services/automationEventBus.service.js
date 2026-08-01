const EventEmitter = require('events');
const logger = require('../../aiCore/logger.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');

const TAG = 'AutomationEventBus';

class AutomationEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    // Listen for generic automation events
    this.on('event', async (eventData) => {
      try {
        await this.handleEvent(eventData);
      } catch (error) {
        logger.error(TAG, `Error handling event: ${error.message}`, { eventData });
      }
    });
  }

  /**
   * Dispatch an event to the Event Bus
   * @param {Object} eventData - The event payload
   * @param {string} eventData.source - e.g., 'scheduler', 'webhook', 'search_console_sync'
   * @param {string} eventData.projectId - Associated project ID
   * @param {string} [eventData.eventType] - Specific event type
   * @param {Object} [eventData.payload] - Additional data
   */
  dispatch(eventData) {
    if (!eventData.projectId || !eventData.source) {
      logger.warn(TAG, 'Dispatched event missing projectId or source');
      return;
    }
    this.emit('event', eventData);
  }

  /**
   * Internal handler for events, routes them to Trigger Registry
   */
  async handleEvent(eventData) {
    const registry = getTriggerRegistry();
    
    // Evaluate which workflows should trigger based on this event
    const matchedTriggers = await registry.evaluateEvent(eventData);

    if (matchedTriggers.length > 0) {
      logger.info(TAG, `Event ${eventData.source} matched ${matchedTriggers.length} triggers for project ${eventData.projectId}`);
      
      for (const trigger of matchedTriggers) {
        // Push matched triggers to the enhanced Execution Queue
        await executionQueue.enqueueWorkflowExecution({
          projectId: eventData.projectId,
          workflowId: trigger.workflowId,
          versionId: trigger.versionId,
          triggerContext: {
            sourceEvent: eventData,
            triggerMatched: trigger.metadata
          }
        });
      }
    }
  }
}

// Singleton instance
const eventBus = new AutomationEventBus();

module.exports = eventBus;
