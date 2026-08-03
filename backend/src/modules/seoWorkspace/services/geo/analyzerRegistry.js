const logger = require('../../../aiCore/logger.service');
const geoConfig = require('./geoConfig');

const TAG = 'GeoAnalyzerRegistry';

class AnalyzerRegistry {
  constructor() {
    this.analyzers = new Map();
    this.registerEnabledAnalyzers();
  }

  registerEnabledAnalyzers() {
    for (const analyzerName of geoConfig.enabledAnalyzers) {
      try {
        // We require the analyzer dynamically based on the configuration
        const AnalyzerClass = require(`./analyzers/${analyzerName}`);
        this.analyzers.set(analyzerName, new AnalyzerClass());
      } catch (error) {
        logger.error(TAG, `Failed to load analyzer: ${analyzerName}. ${error.message}`);
      }
    }
  }

  /**
   * Executes the enabled analyzers in sequence (to respect dependencies) or parallel batches.
   * @param {Array} pages - The list of crawled pages.
   * @param {Object} context - Context containing project info, previous audit data for caching, etc.
   * @returns {Object} Aggregated results from all analyzers.
   */
  async runAll(pages, context) {
    const results = {};
    const executionMeta = {};

    for (const analyzerName of geoConfig.enabledAnalyzers) {
      const analyzer = this.analyzers.get(analyzerName);
      if (!analyzer) {
        results[analyzerName] = { status: 'skipped', reason: 'Not loaded' };
        continue;
      }

      const startTime = Date.now();
      try {
        logger.info(TAG, `Running ${analyzerName}...`, { projectId: context.projectId });
        // Analyzers can use results from previously run analyzers via the `results` object
        const result = await analyzer.analyze(pages, context, results);
        const runtimeMs = Date.now() - startTime;
        
        results[analyzerName] = {
          ...result,
          status: 'success',
          metadata: {
            analyzer: analyzerName,
            version: analyzer.version || '1.0',
            runtimeMs
          }
        };
      } catch (error) {
        const runtimeMs = Date.now() - startTime;
        logger.error(TAG, `Analyzer ${analyzerName} failed: ${error.message}`, { projectId: context.projectId, error });
        
        results[analyzerName] = {
          score: 0,
          confidence: 0,
          weight: geoConfig.weights[analyzerName.replace('Analyzer', '')] || 0,
          status: 'failed',
          metadata: {
            analyzer: analyzerName,
            version: analyzer?.version || '1.0',
            runtimeMs,
            error: error.message
          },
          evidence: [],
          recommendations: []
        };
      }
    }

    return results;
  }
}

// Export as a singleton
module.exports = new AnalyzerRegistry();
