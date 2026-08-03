module.exports = {
  id: 'trigger_technical_audit_completed',
  metadata: () => ({
    id: 'trigger_technical_audit_completed',
    name: 'Technical Audit Completed',
    description: 'Triggers when a crawl audit finishes or health score drops below threshold',
    category: 'triggers',
    icon: 'activity',
    inputs: [],
    outputs: ['auditId', 'healthScore', 'criticalIssuesCount', 'warningsCount', 'pagesCrawled', 'brokenLinksCount']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.minCriticalIssues && (eventPayload.criticalIssuesCount || 0) < Number(config.minCriticalIssues)) {
      return false;
    }
    if (config.maxHealthScore && (eventPayload.healthScore || 100) > Number(config.maxHealthScore)) {
      return false;
    }
    return true;
  }
};
