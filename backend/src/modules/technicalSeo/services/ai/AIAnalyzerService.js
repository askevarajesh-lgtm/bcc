/**
 * AIAnalyzerService
 * Analyzes raw plugin execution results and generates high-level insights.
 */

const { eventBus, EVENTS } = require('../../events/EventBus');
const FeatureFlagProvider = require('../../providers/FeatureFlagProvider');
const aiEngine = require('../../../aiCore/aiEngine.service');

class AIAnalyzerService {
  /**
   * Analyze raw data.
   * @param {Object} context - { auditId, projectId, workspaceId }
   * @param {Object} rawData - aggregated results from all plugins
   */
  static async analyze(context, rawData) {
    if (!FeatureFlagProvider.isEnabled('ENABLE_AI_RECOMMENDATIONS')) {
      return { summary: 'AI analysis disabled via feature flags.' };
    }

    eventBus.dispatch(EVENTS.AI_STARTED, { ...context, service: 'Analyzer' });

    // In reality, this prompt would be loaded from a centralized `prompts/` directory
    const prompt = `You are a Senior Technical SEO Analyst. Analyze the following site crawl signals and output a 3-sentence executive summary of the site's overall infrastructure health: ${JSON.stringify(rawData)}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId,
        projectId: context.projectId,
        agentKey: 'technical-seo-analyzer',
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o', // Should use ConfigProvider in reality
        temperature: 0.3
      });

      eventBus.dispatch(EVENTS.AI_COMPLETED, { ...context, service: 'Analyzer' });
      return { summary: response };
    } catch (error) {
      console.error('[AIAnalyzerService] Failed to analyze:', error);
      return { summary: 'Analysis failed.' };
    }
  }
}

module.exports = AIAnalyzerService;
