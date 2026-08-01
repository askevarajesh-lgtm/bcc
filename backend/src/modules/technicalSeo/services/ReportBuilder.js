/**
 * ReportBuilder
 * Generates decoupled reports for Executive, Developer, and Agency audiences.
 */

class ReportBuilder {
  /**
   * Build an Executive Summary Report
   * Focus: High-level scores, top metrics, AI summaries.
   */
  static buildExecutiveReport(auditData) {
    return {
      type: 'Executive',
      overallHealth: auditData.scores?.overall || 0,
      summary: auditData.aiSummary || 'No summary available.',
      keyMetrics: {
        totalIssues: auditData.issues?.length || 0,
        pagesCrawled: auditData.crawlStats?.pagesCrawled || 0
      }
    };
  }

  /**
   * Build a Developer Report
   * Focus: Granular issues, URLs, code snippets, actionable fixes.
   */
  static buildDeveloperReport(auditData) {
    return {
      type: 'Developer',
      issues: (auditData.issues || []).map(issue => ({
        id: issue._id,
        category: issue.category,
        severity: issue.severity,
        issueDesc: issue.issue,
        affectedUrls: issue.affectedUrls,
        aiFix: issue.aiRecommendation
      }))
    };
  }
}

module.exports = ReportBuilder;
