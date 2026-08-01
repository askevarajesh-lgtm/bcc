/**
 * ConfigProvider
 * Centralized configuration resolution hierarchy: Audit -> Project -> Workspace -> Global Default.
 */

const DEFAULT_CONFIG = {
  crawler: {
    maxPages: 1000,
    maxDepth: 10,
    concurrency: 5,
    timeout: 30000,
    retries: 2,
    renderingEnabled: false
  },
  ai: {
    enabled: true,
    model: 'gpt-4o',
    analysisLevel: 'standard'
  },
  scoring: {
    strictMode: false
  }
};

class ConfigProvider {
  /**
   * Resolve configuration for an audit given its context.
   * @param {Object} context - { auditConfig, projectConfig, workspaceConfig }
   * @param {string} key - The dot-notation key (e.g., 'crawler.maxPages')
   */
  static get(context, key) {
    const { auditConfig = {}, projectConfig = {}, workspaceConfig = {} } = context || {};

    const resolveValue = (configObj, path) => {
      return path.split('.').reduce((acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined), configObj);
    };

    const auditVal = resolveValue(auditConfig, key);
    if (auditVal !== undefined) return auditVal;

    const projectVal = resolveValue(projectConfig, key);
    if (projectVal !== undefined) return projectVal;

    const workspaceVal = resolveValue(workspaceConfig, key);
    if (workspaceVal !== undefined) return workspaceVal;

    return resolveValue(DEFAULT_CONFIG, key);
  }

  /**
   * Get the entire resolved configuration object.
   * @param {Object} context 
   */
  static getMergedConfig(context) {
    const { auditConfig = {}, projectConfig = {}, workspaceConfig = {} } = context || {};
    
    // Deep merge function
    const merge = (target, source) => {
      for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
          Object.assign(source[key], merge(target[key] || {}, source[key]));
        }
      }
      return { ...target, ...source };
    };

    let merged = merge({}, DEFAULT_CONFIG);
    merged = merge(merged, workspaceConfig);
    merged = merge(merged, projectConfig);
    merged = merge(merged, auditConfig);

    return merged;
  }
}

module.exports = ConfigProvider;
