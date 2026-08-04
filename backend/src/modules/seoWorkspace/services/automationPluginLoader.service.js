const fs = require('fs');
const path = require('path');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationPluginLoader';

class AutomationPluginLoader {
  constructor() {
    this._plugins = new Map();
    this._actions = new Map();
    this._triggers = new Map();
  }

  /**
   * Discovers and registers all node modules from the nodes directory and any external SEO module plugins
   */
  async initialize() {
    logger.info(TAG, 'Initializing dynamic capability-based SEO automation plugins...');
    const nodesDir = path.join(__dirname, 'nodes');
    
    if (!fs.existsSync(nodesDir)) {
      logger.warn(TAG, `Nodes directory not found at ${nodesDir}`);
      return;
    }

    const files = fs.readdirSync(nodesDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const nodePath = path.join(nodesDir, file);
        delete require.cache[require.resolve(nodePath)];
        const nodeModule = require(nodePath);

        if (!nodeModule || !nodeModule.id) {
          logger.warn(TAG, `Skipping invalid node file: ${file} (missing id)`);
          continue;
        }

        const isTrigger = file.startsWith('trigger.') || nodeModule.id.startsWith('trigger_') || nodeModule.type === 'trigger';

        if (isTrigger) {
          this.registerTrigger(nodeModule);
        } else {
          this.registerAction(nodeModule);
        }
      } catch (err) {
        logger.error(TAG, `Failed to load node module from ${file}: ${err.message}`, { stack: err.stack });
      }
    }

    logger.info(TAG, `Successfully loaded ${this._triggers.size} triggers and ${this._actions.size} actions into dynamic registry.`);
  }

  registerAction(actionModule) {
    if (!actionModule.id) throw new Error('Action must have a unique ID');
    
    // Ensure Universal Action Contract normalization
    const normalized = {
      id: actionModule.id,
      name: actionModule.name || (actionModule.metadata ? actionModule.metadata().name : actionModule.id),
      category: actionModule.category || (actionModule.metadata ? actionModule.metadata().category : 'general_actions'),
      icon: actionModule.icon || (actionModule.metadata ? actionModule.metadata().icon : 'Zap'),
      description: actionModule.description || (actionModule.metadata ? actionModule.metadata().description : ''),
      documentation: actionModule.documentation || {
        overview: actionModule.description || '',
        inputsDoc: [],
        outputsDoc: [],
        bestPractices: 'Configure required inputs and connect to downstream nodes.',
        commonErrors: 'Ensure required project parameters and credentials are valid.'
      },
      capabilities: {
        supportsScheduling: true,
        supportsSimulation: true,
        supportsRetry: true,
        supportsRollback: typeof actionModule.compensate === 'function',
        supportsStreaming: Boolean(actionModule.supportsStreaming),
        supportsCostEstimation: true,
        ...(actionModule.capabilities || {})
      },
      estimatedRuntimeMs: actionModule.estimatedRuntimeMs || 2500,
      estimatedCost: actionModule.estimatedCost || { apiCalls: 1, aiTokens: 0, thirdPartyCalls: 0 },
      dependencies: actionModule.dependencies || [],
      permissions: actionModule.permissions || ['seo:workspace:execute'],
      getInputSchema: actionModule.getInputSchema || (() => (actionModule.inputs || [])),
      getOutputSchema: actionModule.getOutputSchema || (() => (actionModule.outputs || {})),
      validate: actionModule.validate || (() => ({ valid: true })),
      execute: actionModule.execute || (async (config) => ({ success: true, executed: true, data: config })),
      compensate: actionModule.compensate || (async () => ({ success: true, compensated: true }))
    };

    this._actions.set(normalized.id, normalized);
  }

  registerTrigger(triggerModule) {
    if (!triggerModule.id) throw new Error('Trigger must have a unique ID');

    const normalized = {
      id: triggerModule.id,
      name: triggerModule.name || (triggerModule.metadata ? triggerModule.metadata().name : triggerModule.id),
      type: triggerModule.type || 'event',
      category: triggerModule.category || (triggerModule.metadata ? triggerModule.metadata().category : 'triggers'),
      icon: triggerModule.icon || (triggerModule.metadata ? triggerModule.metadata().icon : 'Radio'),
      description: triggerModule.description || (triggerModule.metadata ? triggerModule.metadata().description : ''),
      documentation: triggerModule.documentation || {
        overview: triggerModule.description || '',
        bestPractices: 'Use specific filter predicates to prevent redundant workflow triggers.'
      },
      capabilities: {
        supportsScheduling: triggerModule.id.includes('schedule') || triggerModule.type === 'schedule',
        supportsFiltering: true,
        supportsPreview: true,
        ...(triggerModule.capabilities || {})
      },
      scheduleMetadata: triggerModule.scheduleMetadata || {
        supportsCron: true,
        supportedFrequencies: ['hourly', 'daily', 'weekly', 'monthly', 'custom']
      },
      eventMetadata: triggerModule.eventMetadata || {
        eventName: triggerModule.id.replace('trigger_', '').toUpperCase(),
        sourceModule: 'seoWorkspace'
      },
      supportedFilters: triggerModule.supportedFilters || [],
      getInputSchema: triggerModule.getInputSchema || (() => (triggerModule.inputs || [])),
      getOutputSchema: triggerModule.getOutputSchema || (() => (triggerModule.outputs || triggerModule.payloadSchema || {})),
      previewPayload: triggerModule.previewPayload || {},
      validate: triggerModule.validate || (() => ({ valid: true })),
      evaluate: triggerModule.evaluate || triggerModule.match || (() => true)
    };

    this._triggers.set(normalized.id, normalized);
  }

  getAction(id) {
    return this._actions.get(id);
  }

  getTrigger(id) {
    return this._triggers.get(id);
  }

  listActions() {
    return Array.from(this._actions.values()).map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      icon: a.icon,
      description: a.description,
      documentation: a.documentation,
      capabilities: a.capabilities,
      estimatedRuntimeMs: a.estimatedRuntimeMs,
      estimatedCost: a.estimatedCost,
      dependencies: a.dependencies,
      permissions: a.permissions,
      inputs: a.getInputSchema(),
      outputs: a.getOutputSchema()
    }));
  }

  listTriggers() {
    return Array.from(this._triggers.values()).map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      category: t.category,
      icon: t.icon,
      description: t.description,
      documentation: t.documentation,
      capabilities: t.capabilities,
      scheduleMetadata: t.scheduleMetadata,
      eventMetadata: t.eventMetadata,
      supportedFilters: t.supportedFilters,
      inputs: t.getInputSchema(),
      outputs: t.getOutputSchema(),
      previewPayload: t.previewPayload
    }));
  }
}

const pluginLoader = new AutomationPluginLoader();

module.exports = {
  AutomationPluginLoader,
  pluginLoader,
  getPluginLoader: () => pluginLoader
};
