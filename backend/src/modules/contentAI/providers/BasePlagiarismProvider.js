class BasePlagiarismProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Check content for plagiarism.
   * @param {string} text - The content to check.
   * @returns {Promise<Object>} - Format: { similarityScore, duplicateSentences: [], originalSources: [] }
   */
  async checkPlagiarism(text) {
    throw new Error('checkPlagiarism method must be implemented by the provider');
  }
}

module.exports = BasePlagiarismProvider;
