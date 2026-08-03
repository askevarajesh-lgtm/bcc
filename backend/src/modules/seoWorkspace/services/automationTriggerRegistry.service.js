const logger = require('../../aiCore/logger.service');
const TAG = 'AutomationTriggerRegistry';

class AutomationTriggerRegistry {
  constructor() {
    this._triggers = new Map();
  }

  /**
   * Register a new trigger module
   * @param {Object} triggerModule - The trigger implementation
   */
  register(triggerModule) {
    if (!triggerModule.id) {
      throw new Error('Invalid trigger module: missing id');
    }

    // Normalize match/evaluate function
    if (!triggerModule.evaluate && typeof triggerModule.match === 'function') {
      triggerModule.evaluate = (eventPayload, config) => triggerModule.match(config, eventPayload);
    } else if (!triggerModule.evaluate) {
      triggerModule.evaluate = () => true;
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

    const filter = { status: 'Published' };
    if (eventData.projectId) {
      filter.projectId = eventData.projectId;
    }

    const publishedWorkflows = await AutomationWorkflow.find(filter).lean();
    if (publishedWorkflows.length === 0) return [];

    const activeVersionIds = publishedWorkflows.map(w => w.activeVersionId).filter(Boolean);
    const versions = await AutomationWorkflowVersion.find({ _id: { $in: activeVersionIds } }).lean();

    for (const version of versions) {
      const triggerNodes = (version.nodes || []).filter(n => n.type === 'trigger');
      for (const node of triggerNodes) {
        const triggerId = node.data?.triggerId || node.data?.type || node.id;
        const triggerImpl = this._triggers.get(triggerId);
        if (triggerImpl && typeof triggerImpl.evaluate === 'function') {
          const isMatch = await triggerImpl.evaluate(eventData, node.data?.config);
          if (isMatch) {
            matchedTriggers.push({
              workflowId: version.workflowId,
              versionId: version._id,
              projectId: version.projectId || eventData.projectId,
              metadata: { nodeId: node.id, triggerId }
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
  getTriggerRegistry: () => registry,
  triggerRegistry: registry
};
