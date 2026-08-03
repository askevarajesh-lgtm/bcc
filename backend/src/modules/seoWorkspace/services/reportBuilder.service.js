class ReportBuilderService {
  /**
   * Compiles the final report structure from metrics, charts, and AI sections.
   * Maintains backward compatibility by also generating a monolithic Markdown fallback if requested.
   */
  buildStructuredReport(metrics, charts, aiSections) {
    const reportData = {
      executiveSummary: aiSections.executiveSummary || null,
      reportSummary: aiSections.reportSummary || null,
      recommendations: aiSections.recommendations || [],
      quickWins: aiSections.quickWins || [],
      biggestImprovements: aiSections.biggestImprovements || [],
      biggestRegressions: aiSections.biggestRegressions || [],
      criticalIssues: aiSections.criticalIssues || [],
      actionPlan: aiSections.actionPlan || null,
      charts: charts,
      metrics: metrics
    };

    return reportData;
  }

  /**
   * Generates a markdown representation of the report for legacy fallback.
   */
  buildMarkdownFallback(reportData) {
    let md = `# SEO Report\n\n`;
    
    if (reportData.executiveSummary) {
      md += `## Executive Summary\n${reportData.executiveSummary.content || reportData.executiveSummary}\n\n`;
    }

    md += `## Metrics Overview\n`;
    md += `- **SEO Score:** ${reportData.metrics.seoScore}\n`;
    md += `- **Technical Score:** ${reportData.metrics.technicalScore}\n`;
    md += `- **Content Score:** ${reportData.metrics.contentScore}\n`;
    md += `- **Performance Score:** ${reportData.metrics.performanceScore}\n\n`;

    if (reportData.actionPlan) {
      md += `## Action Plan\n${reportData.actionPlan.content || reportData.actionPlan}\n\n`;
    }

    return md;
  }
}

module.exports = new ReportBuilderService();
