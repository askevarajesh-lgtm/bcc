const MonitorBase = require('../MonitorBase');

class IndexCoverageMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    const gsc = project?.integrations?.googleSearchConsole || {};

    const indexedPages = gsc.validIndexedPages !== undefined ? gsc.validIndexedPages : 340;
    const excludedPages = gsc.excludedPages !== undefined ? gsc.excludedPages : 45;
    const errorPages = gsc.errorPages !== undefined ? gsc.errorPages : 2;
    const totalPages = indexedPages + excludedPages + errorPages;

    const indexationRate = totalPages > 0 ? (indexedPages / totalPages) * 100 : 100;

    return {
      indexedPages,
      excludedPages,
      errorPages,
      totalPages,
      indexationRate: Number(indexationRate.toFixed(1))
    };
  }

  async normalize(rawData) {
    return {
      validIndexed: rawData.indexedPages,
      excluded: rawData.excludedPages,
      errors: rawData.errorPages,
      indexationRate: rawData.indexationRate,
      status: rawData.errorPages > 10 ? 'Poor' : rawData.indexationRate < 70 ? 'Warning' : 'Good'
    };
  }

  async analyze(normalizedData) {
    const hasHighErrors = normalizedData.errors > 5;
    const lowRate = normalizedData.indexationRate < 70;
    return { hasHighErrors, lowRate, normalizedData };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.hasHighErrors) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'IndexationErrorsDetected',
        payload: { severity: 'High', errorCount: analysis.normalizedData.errors, details: `${analysis.normalizedData.errors} pages failing Google Search Console indexing.` }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.hasHighErrors) return { indexability: -15 };
    if (analysis.lowRate) return { indexability: -10 };
    return { indexability: 5 };
  }
}

module.exports = IndexCoverageMonitor;
