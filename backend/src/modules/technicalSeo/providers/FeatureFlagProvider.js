/**
 * FeatureFlagProvider
 * Provides a standardized way to check if a feature is enabled.
 */

const FLAGS = {
  USE_BULLMQ: process.env.FF_USE_BULLMQ === 'true',
  USE_PLAYWRIGHT_RENDERING: process.env.FF_USE_PLAYWRIGHT === 'true',
  USE_DATAFORSEO_RENDERING: process.env.FF_USE_DATAFORSEO_RENDERING === 'true',
  ENABLE_AI_RECOMMENDATIONS: process.env.FF_ENABLE_AI_RECOMMENDATIONS !== 'false', // Default true
  ENABLE_SCHEMA_VALIDATION: process.env.FF_ENABLE_SCHEMA_VALIDATION !== 'false',
  ENABLE_INTERNAL_LINK_GRAPH: process.env.FF_ENABLE_INTERNAL_LINK_GRAPH === 'true',
  ENABLE_SECURITY_SCAN: process.env.FF_ENABLE_SECURITY_SCAN !== 'false',
  ENABLE_IMAGE_ANALYSIS: process.env.FF_ENABLE_IMAGE_ANALYSIS !== 'false',
};

class FeatureFlagProvider {
  /**
   * Check if a specific feature flag is enabled globally.
   * @param {string} featureName 
   * @returns {boolean}
   */
  static isEnabled(featureName) {
    if (FLAGS[featureName] !== undefined) {
      return FLAGS[featureName];
    }
    // Default to false if the flag is unknown
    return false;
  }

  /**
   * Evaluates if a feature is enabled for a specific workspace (mocked for future DB integration).
   * @param {string} featureName 
   * @param {string} workspaceId 
   * @returns {boolean}
   */
  static isEnabledForWorkspace(featureName, workspaceId) {
    // In the future, this can query a DB table `WorkspaceFeatureFlags`
    // For now, it falls back to the global flag
    return this.isEnabled(featureName);
  }
}

module.exports = FeatureFlagProvider;
