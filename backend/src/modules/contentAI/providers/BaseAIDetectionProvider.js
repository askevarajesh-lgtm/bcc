class BaseAIDetectionProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Check content for AI generation likelihood.
   * @param {string} text - The content to check.
   * @returns {Promise<Object>} - Format: { aiLikelihood: 0-100, humanScore: 0-100, naturalness: 0-100, burstiness: 0-100, feedback: [] }
   */
  async checkAIDetection(text) {
    throw new Error('checkAIDetection method must be implemented by the provider');
  }
}

module.exports = BaseAIDetectionProvider;
