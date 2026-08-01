class AIReportProvider {
  /**
   * Generates a specific section of the SEO report.
   * @param {Object} data - The data snapshot and metrics for context.
   * @param {String} sectionType - e.g. 'executiveSummary', 'technicalSeo', 'actionPlan'
   * @param {String} tone - e.g. 'professional', 'persuasive'
   * @param {String} workspaceId - For identifying any API key or billing logic.
   * @returns {Promise<Object>} JSON response containing the generated text/insights.
   */
  async generateSection(data, sectionType, tone, workspaceId) {
    throw new Error('generateSection must be implemented by provider');
  }

  /**
   * Fallback generation if a structured section fails.
   */
  async generateMonolithicReport(data, workspaceId) {
    throw new Error('generateMonolithicReport must be implemented by provider');
  }
}

module.exports = AIReportProvider;
