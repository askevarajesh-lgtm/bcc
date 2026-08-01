class BaseAnalyzer {
  constructor(name, version = '1.0') {
    this.name = name;
    this.version = version;
  }

  /**
   * The main analysis method that all analyzers must implement.
   * @param {Array} pages - The crawled pages
   * @param {Object} context - Execution context (e.g., projectId)
   * @param {Object} previousResults - Results from analyzers that ran before this one
   * @returns {Promise<Object>} The standardized result object
   */
  async analyze(pages, context, previousResults) {
    throw new Error('Analyze method must be implemented by subclass');
  }

  /**
   * Helper to structure evidence consistently.
   */
  createEvidence(type, severity, page, message) {
    return {
      type,
      severity,
      page,
      message,
      source: this.name
    };
  }

  /**
   * Helper to structure a standardized result.
   */
  createResult(score, confidence, evidence = [], issues = [], recommendations = []) {
    return {
      score,
      confidence,
      evidence,
      issues,
      recommendations
    };
  }
}

module.exports = BaseAnalyzer;
