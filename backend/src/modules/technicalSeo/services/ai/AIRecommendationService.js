/**
 * AIRecommendationService
 * Takes detected issues and enhances them with AI recommendations, severity, and confidence.
 */
const { eventBus, EVENTS } = require('../../events/EventBus');
const aiEngine = require('../../../aiCore/aiEngine.service');

class AIRecommendationService {
  /**
   * Enhance an issue with AI recommendations.
   * @param {Object} context 
   * @param {Object} issueData 
   */
  static async generateRecommendation(context, issueData) {
    eventBus.dispatch(EVENTS.AI_STARTED, { ...context, service: 'Recommendation' });

    const prompt = `Provide a specific, actionable recommendation for this technical SEO issue. Issue: ${issueData.issue}. Category: ${issueData.category}. Output only the raw text recommendation.`;

    try {
      const recommendation = await aiEngine.complete({
        workspaceId: context.workspaceId,
        projectId: context.projectId,
        agentKey: 'technical-seo-recommender',
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
        temperature: 0.2
      });

      eventBus.dispatch(EVENTS.AI_COMPLETED, { ...context, service: 'Recommendation' });
      return recommendation;
    } catch (error) {
      console.error('[AIRecommendationService] Failed to generate recommendation:', error);
      return 'Manual review recommended.';
    }
  }
}

module.exports = AIRecommendationService;
