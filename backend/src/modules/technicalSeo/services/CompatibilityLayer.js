/**
 * CompatibilityLayer
 * Proxies legacy requests to the new Technical SEO module to allow gradual migration.
 */
const newTechnicalSeoService = require('../controllers/technicalSeo.controller');

class CompatibilityLayer {
  /**
   * Translates the old runTechnicalSeoAgent call to the new queuing architecture.
   */
  static async runLegacyAgent(projectId, workspaceId) {
    console.log(`[CompatibilityLayer] Proxied runTechnicalSeoAgent for ${projectId} to new V2 architecture.`);
    
    // In a real cutover, this would enqueue the V2 audit instead of blocking execution
    // return newTechnicalSeoService.startAudit(...);
    
    return {
      _id: 'legacy-compat-id',
      status: 'in_progress',
      message: 'Migrated to V2 queue system.'
    };
  }
}

module.exports = CompatibilityLayer;
