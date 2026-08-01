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

  async evaluateEvent(eventData) {
    const matchedTriggers = [];
    const AutomationWorkflow = require('../models/automationWorkflow.model');
    const AutomationWorkflowVersion = require('../models/automationWorkflowVersion.model');

    const publishedWorkflows = await AutomationWorkflow.find({ status: 'Published' }).lean();
    if (publishedWorkflows.length === 0) return [];

    const activeVersionIds = publishedWorkflows.map(w => w.activeVersionId).filter(Boolean);
    const versions = await AutomationWorkflowVersion.find({ _id: { $in: activeVersionIds } }).lean();

    for (const version of versions) {
      const triggerNodes = (version.nodes || []).filter(n => n.type === 'trigger');
      for (const node of triggerNodes) {
        const triggerImpl = this._triggers.get(node.data?.triggerId);
        if (triggerImpl && typeof triggerImpl.evaluate === 'function') {
          const isMatch = await triggerImpl.evaluate(eventData, node.data?.config);
          if (isMatch) {
            matchedTriggers.push({
              workflowId: version.workflowId,
              versionId: version._id,
              metadata: { nodeId: node.id, triggerId: node.data.triggerId }
            });
          }
        }
      }
    }

    return matchedTriggers;
  }
}

const registry = new AutomationTriggerRegistry();

module.exports = {
  AutomationTriggerRegistry,
  getTriggerRegistry: () => registry
};
