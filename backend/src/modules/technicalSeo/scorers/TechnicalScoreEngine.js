/**
 * TechnicalScoreEngine
 * Aggregates scores from all audit plugins dynamically.
 */

class TechnicalScoreEngine {
  constructor() {
    this.plugins = [];
  }

  /**
   * Register a plugin to contribute to the score.
   * @param {Object} plugin - An instance of BaseAuditPlugin
   */
  registerPlugin(plugin) {
    this.plugins.push(plugin);
  }

  /**
   * Calculate the aggregated score across all registered plugins.
   * @param {Object} allResults - Key-value map of plugin results e.g., { 'indexability': { ... } }
   * @returns {Object} { totalScore, maxPossible, categoryScores, percentage }
   */
  async calculateScore(allResults) {
    let totalScore = 0;
    let maxPossible = 0;
    const categoryScores = {};

    for (const plugin of this.plugins) {
      const resultsForPlugin = allResults[plugin.category];
      if (!resultsForPlugin) continue;

      const score = await plugin.score(resultsForPlugin);
      
      categoryScores[plugin.category] = {
        score,
        maxScore: plugin.maxScore
      };

      totalScore += score;
      maxPossible += plugin.maxScore;
    }

    const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

    return {
      totalScore,
      maxPossible,
      percentage,
      categoryScores
    };
  }
}

module.exports = new TechnicalScoreEngine();
