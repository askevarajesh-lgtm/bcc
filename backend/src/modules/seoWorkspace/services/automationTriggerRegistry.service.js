const logger = require('../../aiCore/logger.service');
const TAG = 'AutomationTriggerRegistry';

class AutomationTriggerRegistry {
  constructor() {
    this._triggers = new Map();
  }

  /**
   * Register a new trigger module
   * @param {Object} triggerModule - The trigger implementation
   * @param {string} triggerModule.id - Unique ID (e.g. 'rank_drop')
   * @param {Function} triggerModule.metadata - Returns trigger metadata
   * @param {Function} triggerModule.validate - Validates node configuration
   * @param {Function} triggerModule.evaluate - Evaluates if the trigger condition is met
   */
  register(triggerModule) {
    if (!triggerModule.id || typeof triggerModule.evaluate !== 'function') {
      throw new Error('Invalid trigger module');
    }
    this._triggers.set(triggerModule.id, triggerModule);
    logger.info(TAG, `Registered trigger: ${triggerModule.id}`);
  }

  getTrigger(id) {
    return this._triggers.get(id);
  }

  listTriggers() {
    return Array.from(this._triggers.values()).map(t => t.metadata ? t.metadata() : { id: t.id });
  }

  /**
   * Evaluates an incoming event against all active workflows to see which ones should fire.
   * In a real implementation, this would query active workflows, check their trigger nodes,
   * and call triggerModule.evaluate() on them.
   * @param {Object} eventData
   * @returns {Promise<Array>} Array of matched workflows to execute
   */
  async evaluateEvent(eventData) {
    // Phase 2 will implement full DB lookup for active workflows that match this event type.
    // For now, this is a stub that allows the Event Bus to function.
    return [];
  }
}

const registry = new AutomationTriggerRegistry();

module.exports = {
  AutomationTriggerRegistry,
  getTriggerRegistry: () => registry
};
