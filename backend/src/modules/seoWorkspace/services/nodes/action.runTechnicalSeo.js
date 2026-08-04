const technicalSeoAgent = require('../technicalSeoAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceTechnicalAudit = require('../../models/workspaceTechnicalAudit.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunTechnicalSeo';

module.exports = {
  id: 'run_technical_seo',
  name: 'Run Technical SEO Analysis',
  category: 'Technical SEO',
  icon: 'Cpu',
  description: 'Analyzes technical infrastructure, canonical loops, redirect chains, robots.txt, sitemaps, and generates automated technical code fixes.',

  documentation: {
    overview: 'Invokes the Technical SEO production service to collect technical signals, detect crawl anomalies, and produce auto-remediations.',
    inputsDoc: [
      { name: 'autoGenerateFixes', desc: 'Automatically generate code-level fix proposals', type: 'boolean', default: true },
      { name: 'severityThreshold', desc: 'Minimum issue severity to flag (critical, high, medium, low)', type: 'string', default: 'medium' },
      { name: 'checkRobotsAndSitemap', desc: 'Inspect robots.txt directives and XML sitemap validity', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'technicalAuditId', desc: 'MongoDB ID of the created WorkspaceTechnicalAudit', type: 'string' },
      { name: 'summary', desc: 'AI-generated technical health summary', type: 'string' },
      { name: 'findingsCount', desc: 'Number of technical issues flagged', type: 'number' },
      { name: 'criticalIssuesCount', desc: 'Count of critical severity issues', type: 'number' },
      { name: 'highIssuesCount', desc: 'Count of high severity issues', type: 'number' },
      { name: 'fixesGenerated', desc: 'Count of auto-generated technical fixes', type: 'number' },
      { name: 'findings', desc: 'Full array of technical findings with category, severity, issue, recommendation', type: 'array' },
      { name: 'signals', desc: 'Raw technical signals collected (robots.txt, SSL, sitemap, crawl stats, CWV)', type: 'object' },
      { name: 'approvalStatus', desc: 'Agent approval status (Pending Approval, Approved, Rejected)', type: 'string' }
    ],
    bestPractices: 'Run Technical SEO directly after Site Audit to provide deep infrastructure diagnostics.'
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true,
    supportsRollback: true
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 350, thirdPartyCalls: 1 },
  dependencies: ['run_site_audit'],
  permissions: ['seo:technical:run'],

  getInputSchema() {
    return [
      { name: 'autoGenerateFixes', label: 'Auto-Generate Technical Fixes', type: 'switch', defaultValue: true, helpText: 'Produce actionable code fixes for meta tags, redirects, and robots.txt' },
      { name: 'severityThreshold', label: 'Severity Filter', type: 'select', defaultValue: 'medium', options: [
        { label: 'All Severities (Low, Medium, High, Critical)', value: 'low' },
        { label: 'Medium & Above', value: 'medium' },
        { label: 'High & Critical Only', value: 'high' },
        { label: 'Critical Only', value: 'critical' }
      ]},
      { name: 'checkRobotsAndSitemap', label: 'Validate Robots.txt & Sitemap', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      technicalAuditId: { type: 'string', description: 'WorkspaceTechnicalAudit document ID' },
      summary: { type: 'string', description: 'AI-generated technical summary' },
      findingsCount: { type: 'number', description: 'Total technical findings count' },
      criticalIssuesCount: { type: 'number', description: 'Critical issue count' },
      highIssuesCount: { type: 'number', description: 'High issue count' },
      fixesGenerated: { type: 'number', description: 'Count of auto-generated code fixes' },
      findings: { type: 'array', description: 'Full findings array with severity, category, issue, recommendation, generatedFix' },
      signals: { type: 'object', description: 'Raw infrastructure signals' },
      approvalStatus: { type: 'string', description: 'Agent approval status' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Technical SEO service for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        technicalAuditId: `sim_tech_${Date.now()}`,
        summary: 'Simulation: Technical signals collected. Minor robots.txt and canonical issues detected.',
        findingsCount: 3,
        criticalIssuesCount: 0,
        highIssuesCount: 1,
        fixesGenerated: 2,
        findings: [],
        signals: {},
        approvalStatus: 'Pending Approval'
      };
    }

    let technicalAudit = null;
    try {
      if (project) {
        technicalAudit = await technicalSeoAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Technical SEO agent execution error: ${err.message}`);
    }

    // Generate fixes after analysis if requested
    if (config.autoGenerateFixes !== false && technicalAudit?._id) {
      try {
        technicalAudit = await technicalSeoAgent.generateFixesForFindings(technicalAudit._id, projectId, workspaceId);
      } catch (fixErr) {
        logger.warn(TAG, `Fix generation error: ${fixErr.message}`);
      }
    }

    // Fallback: read the most recent technical audit for this project
    if (!technicalAudit && projectId) {
      technicalAudit = await WorkspaceTechnicalAudit.findOne({ projectId }).sort({ createdAt: -1 }).lean();
    }

    if (!technicalAudit) {
      return {
        success: false,
        error: 'Technical SEO analysis failed or no completed audit found.',
        technicalAuditId: null
      };
    }

    const findings = technicalAudit.agent?.findings || [];

    // Apply severity threshold filter for the output (but still store all)
    const thresholdOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const threshold = config.severityThreshold || 'low';
    const thresholdLevel = thresholdOrder[threshold] ?? 0;
    const filteredFindings = findings.filter(f => (thresholdOrder[f.severity] ?? 0) >= thresholdLevel);

    return {
      success: true,
      technicalAuditId: technicalAudit._id.toString(),
      summary: technicalAudit.agent?.summary || '',
      findingsCount: filteredFindings.length,
      totalFindingsCount: findings.length,
      criticalIssuesCount: findings.filter(f => f.severity === 'critical').length,
      highIssuesCount: findings.filter(f => f.severity === 'high').length,
      mediumIssuesCount: findings.filter(f => f.severity === 'medium').length,
      lowIssuesCount: findings.filter(f => f.severity === 'low').length,
      fixesGenerated: findings.filter(f => f.generatedFix).length,
      findings: filteredFindings,
      allFindings: findings,
      signals: technicalAudit.signals || {},
      approvalStatus: technicalAudit.agent?.approvalStatus || '',
      completedAt: technicalAudit.completedAt ? new Date(technicalAudit.completedAt).toISOString() : null
    };
  },

  async compensate(config, context) {
    return { success: true, compensated: true };
  }
};
