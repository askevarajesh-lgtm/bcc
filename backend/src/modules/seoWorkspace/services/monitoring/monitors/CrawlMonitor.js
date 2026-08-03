const MonitorBase = require('../MonitorBase');
const WorkspaceAudit = require('../../../models/workspaceAudit.model');

class CrawlMonitor extends MonitorBase {
  async collect(context) {
    const { projectId } = context;
    const latestAudit = await WorkspaceAudit.findOne({ projectId, status: 'Completed' }).sort({ createdAt: -1 }).lean();

    if (!latestAudit) {
      return {
        hasAudit: false,
        criticalCount: 0,
        warningCount: 0,
        totalUrlsScanned: 0,
        statusCodeBreakdown: { '200': 100, '404': 0, '500': 0 }
      };
    }

    const issues = latestAudit.issues || [];
    const criticalCount = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'warning' || i.severity === 'medium').length;

    return {
      hasAudit: true,
      auditId: latestAudit._id,
      score: latestAudit.score || 85,
      criticalCount,
      warningCount,
      totalUrlsScanned: latestAudit.pagesCrawled || 50,
      brokenLinksCount: latestAudit.brokenLinksCount || 0
    };
  }

  async normalize(rawData) {
    return {
      healthScore: rawData.score || 85,
      criticalIssues: rawData.criticalCount,
      warningIssues: rawData.warningCount,
      pagesScanned: rawData.totalUrlsScanned,
      brokenLinks: rawData.brokenLinksCount
    };
  }

  async analyze(normalizedData) {
    const findings = [];
    if (normalizedData.criticalIssues > 0) {
      findings.push({
        severity: 'Critical',
        title: `${normalizedData.criticalIssues} Critical Crawl Issues Detected`,
        count: normalizedData.criticalIssues
      });
    }
    return { findings, normalizedData };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.normalizedData.criticalIssues > 3) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'CriticalCrawlIssuesFound',
        payload: {
          severity: 'Critical',
          criticalCount: analysis.normalizedData.criticalIssues,
          details: `Technical audit detected ${analysis.normalizedData.criticalIssues} critical crawl health issues.`
        }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    const critical = analysis.normalizedData.criticalIssues || 0;
    if (critical > 5) return { technicalHealth: -25 };
    if (critical > 0) return { technicalHealth: -10 };
    return { technicalHealth: 0 };
  }
}

module.exports = CrawlMonitor;
