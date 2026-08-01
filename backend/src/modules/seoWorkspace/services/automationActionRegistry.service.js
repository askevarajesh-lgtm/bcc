const logger = require('../../aiCore/logger.service');
const TAG = 'AutomationActionRegistry';

class AutomationActionRegistry {
  constructor() {
    this._actions = new Map();
  }

  /**
   * Register a new action module
   * @param {Object} actionModule - The action implementation
   * @param {string} actionModule.id - Unique ID (e.g. 'send_slack')
   * @param {Function} actionModule.metadata - Returns action metadata
   * @param {Function} actionModule.validate - Validates node configuration
   * @param {Function} actionModule.execute - Executes the action
   */
  register(actionModule) {
    if (!actionModule.id || typeof actionModule.execute !== 'function') {
      throw new Error('Invalid action module');
    }
    this._actions.set(actionModule.id, actionModule);
    logger.info(TAG, `Registered action: ${actionModule.id}`);
  }

  getAction(id) {
    return this._actions.get(id);
  }

  listActions() {
    return Array.from(this._actions.values()).map(a => a.metadata ? a.metadata() : { id: a.id });
  }
}

const registry = new AutomationActionRegistry();

module.exports = {
  AutomationActionRegistry,
  getActionRegistry: () => registry
};
