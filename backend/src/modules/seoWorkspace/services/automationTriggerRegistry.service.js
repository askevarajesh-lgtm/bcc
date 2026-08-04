const { getPluginLoader } = require('./automationPluginLoader.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationTriggerRegistry';

class AutomationTriggerRegistry {
  register(triggerModule) {
    getPluginLoader().registerTrigger(triggerModule);
  }

  getTrigger(id) {
    return getPluginLoader().getTrigger(id);
  }

  listTriggers() {
    return getPluginLoader().listTriggers();
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
      const triggerNodes = (version.nodes || []).filter(n => n.type === 'trigger' || n.data?.type === 'trigger');
      for (const node of triggerNodes) {
        const triggerId = node.data?.triggerId || node.data?.subtype || node.data?.type || node.id;
        const triggerImpl = this.getTrigger(triggerId) || this.getTrigger(`trigger_${triggerId}`) || this.getTrigger(triggerId.replace('trigger_', ''));
        
        if (triggerImpl && typeof triggerImpl.evaluate === 'function') {
          try {
            const isMatch = await triggerImpl.evaluate(eventData, node.data?.config);
            if (isMatch) {
              matchedTriggers.push({
                workflowId: version.workflowId,
                versionId: version._id,
                projectId: version.projectId || eventData.projectId,
                metadata: { nodeId: node.id, triggerId }
              });
            }
          } catch (err) {
            logger.warn(TAG, `Error evaluating trigger ${triggerId} for workflow ${version.workflowId}: ${err.message}`);
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
