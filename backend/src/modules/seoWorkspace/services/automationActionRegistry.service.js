const { getPluginLoader } = require('./automationPluginLoader.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationActionRegistry';

class AutomationActionRegistry {
  register(actionModule) {
    getPluginLoader().registerAction(actionModule);
  }

  getAction(id) {
    return getPluginLoader().getAction(id);
  }

  listActions() {
    return getPluginLoader().listActions();
  }

  getOutputSchema(id) {
    const action = this.getAction(id);
    return action ? action.getOutputSchema() : {};
  }

  getInputSchema(id) {
    const action = this.getAction(id);
    return action ? action.getInputSchema() : [];
  }
}

const registry = new AutomationActionRegistry();

module.exports = {
  AutomationActionRegistry,
  getActionRegistry: () => registry,
  actionRegistry: registry
};
