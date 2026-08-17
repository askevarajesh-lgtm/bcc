class ScoringService {
  constructor() {
    this.scoringVersion = "1.0.0";
  }

  calculateScoreForCategory(metrics) {
    let totalScore = 0;
    let totalWeight = 0;
    let totalPossibleWeight = 0;

    for (const key in metrics) {
      const metric = metrics[key];
      totalPossibleWeight += metric.weight;
      
      if (metric.available && typeof metric.value === 'number') {
        // Assume metrics are already normalized to a 0-100 scale before getting here
        // or they represent a 0-100 value (like authorityScore, technicalScore).
        // For unbounded metrics like traffic, they need a scoring curve, but for simplicity here
        // we'll cap them or rely on them being pre-normalized.
        
        let normalizedValue = Math.min(100, Math.max(0, metric.value));
        
        totalScore += (normalizedValue * metric.weight);
        totalWeight += metric.weight;
      }
    }

    if (totalWeight === 0) return null;

    return {
      score: Math.round(totalScore / totalWeight),
      weightAvailable: totalWeight,
      totalPossibleWeight: totalPossibleWeight
    };
  }

  calculateOverallScores(dataset) {
    const seoResult = this.calculateScoreForCategory(dataset.seo);
    const geoResult = this.calculateScoreForCategory(dataset.geo);
    const aeoResult = this.calculateScoreForCategory(dataset.aeo);

    const seoScore = seoResult ? seoResult.score : null;
    const geoScore = geoResult ? geoResult.score : null;
    const aeoScore = aeoResult ? aeoResult.score : null;

    let overallTotal = 0;
    let overallCount = 0;

    if (seoScore !== null) { overallTotal += seoScore; overallCount++; }
    if (geoScore !== null) { overallTotal += geoScore; overallCount++; }
    if (aeoScore !== null) { overallTotal += aeoScore; overallCount++; }

    const overallScore = overallCount > 0 ? Math.round(overallTotal / overallCount) : null;

    // Calculate Data Completeness
    let totalAvailWeight = (seoResult?.weightAvailable || 0) + (geoResult?.weightAvailable || 0) + (aeoResult?.weightAvailable || 0);
    let totalPossWeight = (seoResult?.totalPossibleWeight || 0) + (geoResult?.totalPossibleWeight || 0) + (aeoResult?.totalPossibleWeight || 0);

    const dataCompleteness = totalPossWeight > 0 ? Math.round((totalAvailWeight / totalPossWeight) * 100) : 0;
    
    let confidence = 'low';
    if (dataCompleteness > 80) confidence = 'high';
    else if (dataCompleteness > 50) confidence = 'medium';

    let status = 'COMPLETED';
    if (dataCompleteness === 0) status = 'FAILED';
    else if (dataCompleteness < 80) status = 'PARTIAL';

    return {
      scores: {
        overall: overallScore,
        seo: seoScore,
        geo: geoScore,
        aeo: aeoScore
      },
      dataCompleteness,
      confidence,
      status,
      scoringVersion: this.scoringVersion
    };
  }
}

module.exports = new ScoringService();
