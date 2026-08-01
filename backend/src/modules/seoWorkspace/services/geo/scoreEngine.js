const geoConfig = require('./geoConfig');

class ScoreEngine {
  /**
   * Computes the overall GEO score based on the standardized results from all analyzers.
   * @param {Object} analyzerResults - Dictionary of results keyed by analyzer name.
   * @returns {Object} { overallScore, breakdown, healthLevel }
   */
  computeOverallScore(analyzerResults) {
    let totalScore = 0;
    let totalWeight = 0;
    const breakdown = {};

    for (const [analyzerName, result] of Object.entries(analyzerResults)) {
      if (result.status === 'skipped') continue;

      const category = analyzerName.replace('Analyzer', ''); // e.g., 'technicalAnalyzer' -> 'technical'
      const weight = geoConfig.weights[category] || 0;
      
      const score = result.score || 0;
      const confidence = result.confidence || 0;
      
      // Calculate weighted score contribution
      if (weight > 0 && result.status !== 'failed') {
        totalScore += (score * weight);
        totalWeight += weight;
      }

      breakdown[category] = {
        score,
        confidence,
        weight,
        status: result.status
      };
    }

    // Normalize out of 100
    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    const healthLevel = this.determineHealthLevel(overallScore);

    return {
      overallScore,
      healthLevel,
      breakdown
    };
  }

  determineHealthLevel(score) {
    for (const [level, range] of Object.entries(geoConfig.scoreRanges)) {
      if (score >= range.min && score <= range.max) {
        return level;
      }
    }
    return 'poor';
  }
}

module.exports = new ScoreEngine();
