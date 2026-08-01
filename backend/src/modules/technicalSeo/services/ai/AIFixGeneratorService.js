/**
 * AIFixGeneratorService
 * Automatically generates code snippets or configuration files to fix issues.
 */
const { eventBus, EVENTS } = require('../../events/EventBus');
const fixEngine = require('../../../aiCore/fixEngine/fixEngine.service');

class AIFixGeneratorService {
  /**
   * Attempt to auto-generate a fix.
   * @param {Object} context 
   * @param {Object} issue - TechnicalIssue model instance
   */
  static async generateFix(context, issue) {
    if (!issue.autoFixable) return null;

    eventBus.dispatch(EVENTS.AI_STARTED, { ...context, service: 'FixGenerator' });

    try {
      const fix = await fixEngine.generateFix({
        taskType: issue.category,
        finding: { issue: issue.issue, recommendation: issue.aiRecommendation },
        context
      });

      eventBus.dispatch(EVENTS.AI_COMPLETED, { ...context, service: 'FixGenerator' });
      return fix;
    } catch (error) {
      console.error(`[AIFixGeneratorService] Failed to generate fix for ${issue._id}:`, error);
      return null;
    }
  }
}

module.exports = AIFixGeneratorService;
