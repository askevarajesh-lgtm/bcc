const fs = require('fs');
const path = require('path');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationInitialization';

function initializeBuiltInNodes() {
  logger.info(TAG, 'Initializing enterprise automation nodes and trigger suites');

  const triggerRegistry = getTriggerRegistry();
  const actionRegistry = getActionRegistry();

  const nodesDir = path.join(__dirname, 'nodes');
  if (!fs.existsSync(nodesDir)) {
    logger.warn(TAG, `Nodes directory not found at ${nodesDir}`);
    return;
  }

  const files = fs.readdirSync(nodesDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const nodeModule = require(path.join(nodesDir, file));
      if (!nodeModule || !nodeModule.id) continue;

      if (file.startsWith('trigger.') || nodeModule.id.startsWith('trigger_')) {
        triggerRegistry.register(nodeModule);
      } else {
        actionRegistry.register(nodeModule);
      }
    } catch (err) {
      logger.error(TAG, `Failed to load node module from ${file}: ${err.message}`);
    }
  }

  logger.info(TAG, `Successfully loaded ${triggerRegistry.listTriggers().length} triggers and ${actionRegistry.listActions().length} actions`);
}

module.exports = { initializeBuiltInNodes };
