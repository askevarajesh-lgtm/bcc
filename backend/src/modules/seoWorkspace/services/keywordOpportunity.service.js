class KeywordOpportunityService {
  constructor() {
    this.weights = {
      volume: 40,
      difficulty: 30,
      rank: 20,
      intent: 10
    };
  }

  /**
   * Calculates the opportunity score and breakdown.
   * @param {Object} metrics { searchVolume, keywordDifficulty, intent, currentRank } 
   * @returns {{ score: number, breakdown: Object, rationale: string }}
   */
  calculateOpportunity(metrics) {
    let volumeScore = 0;
    const sv = metrics.searchVolume || 0;
    if (sv > 10000) volumeScore = 100;
    else if (sv > 1000) volumeScore = 80;
    else if (sv > 100) volumeScore = 50;
    else if (sv > 10) volumeScore = 20;

    let difficultyScore = 0;
    const kd = metrics.keywordDifficulty || 100; // default to hardest if unknown
    // Invert difficulty (lower is better opportunity)
    difficultyScore = Math.max(0, 100 - kd);

    let rankScore = 0;
    const rank = metrics.currentRank;
    if (!rank || rank > 100) {
      rankScore = 20; // Some opportunity if we don't rank at all, but harder
    } else if (rank > 10) {
      rankScore = 100; // High opportunity (striking distance page 2+)
    } else if (rank > 3) {
      rankScore = 60; // Moderate opportunity (move up to top 3)
    } else {
      rankScore = 10; // Low opportunity (already top 3, diminishing returns)
    }

    let intentScore = 0;
    switch (metrics.intent) {
      case 'transactional': intentScore = 100; break;
      case 'commercial': intentScore = 80; break;
      case 'local': intentScore = 70; break;
      case 'informational': intentScore = 50; break;
      case 'navigational': intentScore = 20; break;
      default: intentScore = 30; break;
    }

    const finalScore = Math.round(
      (volumeScore * (this.weights.volume / 100)) +
      (difficultyScore * (this.weights.difficulty / 100)) +
      (rankScore * (this.weights.rank / 100)) +
      (intentScore * (this.weights.intent / 100))
    );

    const breakdown = {
      volumeScore: Math.round(volumeScore * (this.weights.volume / 100)),
      difficultyScore: Math.round(difficultyScore * (this.weights.difficulty / 100)),
      rankScore: Math.round(rankScore * (this.weights.rank / 100)),
      intentScore: Math.round(intentScore * (this.weights.intent / 100))
    };

    let rationale = '';
    if (finalScore >= 80) rationale = 'High potential: Good volume with achievable difficulty and high intent.';
    else if (finalScore >= 50) rationale = 'Moderate potential: Decent balance, likely requires significant effort or provides steady long-tail value.';
    else rationale = 'Low potential: High difficulty, low volume, or already ranking well.';

    return {
      score: finalScore,
      breakdown,
      rationale
    };
  }
}

module.exports = new KeywordOpportunityService();
