class ChartBuilderService {
  /**
   * Generates declarative chart definitions that the frontend can render directly.
   * @param {Object} metrics - Calculated report metrics
   * @param {Object} historicalData - Array of historical metrics for trend charting
   * @returns {Object} Chart definitions mapped by chart ID
   */
  buildChartDefinitions(metrics, historicalData = []) {
    const definitions = {};

    // Example: SEO Score Trend Chart
    if (historicalData.length > 0) {
      definitions['seoScoreTrend'] = {
        type: 'line',
        title: 'SEO Score Trend',
        labels: historicalData.map(d => d.date),
        datasets: [
          {
            label: 'SEO Score',
            data: historicalData.map(d => d.seoScore),
            color: '#1890ff'
          }
        ],
        metadata: {
          yAxisLabel: 'Score',
          xAxisLabel: 'Date'
        }
      };
    }

    // Example: Core Web Vitals Chart
    if (metrics.coreWebVitals) {
      definitions['coreWebVitals'] = {
        type: 'bar',
        title: 'Core Web Vitals',
        labels: ['LCP', 'FID', 'CLS'],
        datasets: [
          {
            label: 'Current',
            data: [
              metrics.coreWebVitals.lcp || 0,
              metrics.coreWebVitals.fid || 0,
              metrics.coreWebVitals.cls || 0
            ],
            color: '#52c41a'
          }
        ]
      };
    }

    return definitions;
  }
}

module.exports = new ChartBuilderService();
