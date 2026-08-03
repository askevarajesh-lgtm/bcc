class ReportMetricsService {
  /**
   * Calculates metrics by analyzing the provided snapshots.
   * @param {Object} snapshot - The populated WorkspaceReportSnapshot
   * @returns {Object} Structured metrics
   */
  calculateMetrics(snapshot) {
    const metrics = {
      seoScore: 0,
      technicalScore: 0,
      contentScore: 0,
      performanceScore: 0,
      coreWebVitals: {},
      keywordChanges: {},
      backlinkChanges: {},
      issueTrends: {},
      pageHealth: {},
      aeoMetrics: {},
      geoMetrics: {}
    };

    // Safely extract and calculate trends from the provided snapshot data
    if (snapshot.auditSnapshot) {
      // In a real scenario, this would compute deltas between older and newer snapshots if available.
      // Assuming auditSnapshot contains metrics.
      const { performance, onPage, crawlability, overall } = snapshot.auditSnapshot.metrics || {};
      metrics.performanceScore = performance || 0;
      metrics.contentScore = onPage || 0;
      metrics.technicalScore = crawlability || 0;
      metrics.seoScore = overall || 0;
    }

    if (snapshot.cwvSnapshot) {
      metrics.coreWebVitals = snapshot.cwvSnapshot;
    }
    
    // Additional domain-specific metric normalization logic would go here.

    return metrics;
  }
}

module.exports = new ReportMetricsService();
