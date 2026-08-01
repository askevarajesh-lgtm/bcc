const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const logger = require('../../aiCore/logger.service');

// Triggers
const triggerSchedule = require('./nodes/trigger.schedule');
const triggerWebhook = require('./nodes/trigger.webhook');

// Actions
const actionSlack = require('./nodes/action.slack');
const actionAiGenerate = require('./nodes/action.aiGenerate');

const TAG = 'AutomationInitialization';

function initializeBuiltInNodes() {
  logger.info(TAG, 'Initializing built-in automation nodes');

  const triggerRegistry = getTriggerRegistry();
  triggerRegistry.register(triggerSchedule);
  triggerRegistry.register(triggerWebhook);

  const actionRegistry = getActionRegistry();
  actionRegistry.register(actionSlack);
  actionRegistry.register(actionAiGenerate);
}

module.exports = { initializeBuiltInNodes };
