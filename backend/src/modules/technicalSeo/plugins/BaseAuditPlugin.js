/**
 * BaseAuditPlugin
 * Standard interface for all Technical SEO plugins.
 */
class BaseAuditPlugin {
  constructor() {
    this.name = 'BasePlugin';
    this.category = 'other';
  }

  /**
   * Register the plugin with the engine.
   */
  async register() {
    return true;
  }

  /**
   * Prepare necessary resources or external APIs before execution.
   */
  async prepare(context) {
    // e.g. check API keys
  }

  /**
   * Execute the core audit logic.
   * @param {Object} context - { auditId, pageData, config }
   * @returns {Object} raw plugin results
   */
  async execute(context) {
    throw new Error('Method "execute" must be implemented.');
  }

  /**
   * Validate the results for consistency.
   */
  async validate(results) {
    return results;
  }

  /**
   * Calculate and return the weighted score contribution.
   * @param {Object} results
   * @returns {number} score between 0 and max weight
   */
  async score(results) {
    return 0;
  }

  /**
   * Generate human-readable reporting structures from the raw results.
   */
  async report(results) {
    return [];
  }

  /**
   * Generate actionable AI-ready recommendations or raw issues.
   */
  async recommend(results) {
    return [];
  }

  /**
   * Cleanup any temporary resources (e.g. headless browser instances).
   */
  async cleanup() {
    // optional
  }
}

module.exports = BaseAuditPlugin;
