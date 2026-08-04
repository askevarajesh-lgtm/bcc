const { getPluginLoader } = require('./automationPluginLoader.service');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationInitialization';

async function initializeBuiltInNodes() {
  logger.info(TAG, 'Initializing enterprise plugin-based automation nodes, triggers, and scheduler...');

  const pluginLoader = getPluginLoader();
  await pluginLoader.initialize();

  // Also bridge common aliases for backward compatibility
  const actionRegistry = getActionRegistry();
  const siteAuditAction = actionRegistry.getAction('run_site_audit');
  if (siteAuditAction) {
    actionRegistry.register({ ...siteAuditAction, id: 'trigger_site_audit' });
    actionRegistry.register({ ...siteAuditAction, id: 'action_run_site_audit' });
    actionRegistry.register({ ...siteAuditAction, id: 'action_trigger_site_audit' });
  }

  logger.info(TAG, `Automation engine ready. Total triggers: ${pluginLoader.listTriggers().length}, Total actions: ${pluginLoader.listActions().length}`);
}

module.exports = { initializeBuiltInNodes };
