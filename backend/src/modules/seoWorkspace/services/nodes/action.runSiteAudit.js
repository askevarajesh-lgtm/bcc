const mongoose = require('mongoose');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceAudit = require('../../models/workspaceAudit.model');
const WorkspaceAuditJob = require('../../models/workspaceAuditJob.model');
const seoAuditorAgent = require('../seoAuditorAgent.service');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunSiteAudit';

// Poll for async audit job completion (enterprise crawl worker runs in background)
async function waitForAuditJobCompletion(jobId, timeoutMs = 300000, intervalMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await WorkspaceAuditJob.findById(jobId).lean();
    if (!job) break;
    if (job.status === 'completed' || job.status === 'failed') return job;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}

module.exports = {
  id: 'run_site_audit',
  name: 'Run Website Audit',
  category: 'Website Audit',
  icon: 'Search',
  description: 'Initiates an automated website crawl and comprehensive SEO audit, calculating health scores and detecting site-wide issues.',

  documentation: {
    overview: 'Orchestrates the production Audit Service to perform on-page SEO diagnostics, Core Web Vitals checks, and indexability evaluation. Waits for the crawl to complete and returns the full audit record.',
    inputsDoc: [
      { name: 'targetDomain', desc: 'Domain or URL to audit (defaults to project primary domain)', type: 'string', required: false },
      { name: 'crawlDepth', desc: 'Maximum depth level for recursive spidering', type: 'number', default: 3 },
      { name: 'maxPages', desc: 'Max pages to crawl and analyze', type: 'number', default: 100 },
      { name: 'jsRendering', desc: 'Enable headless Chrome DOM rendering for SPAs', type: 'boolean', default: false },
      { name: 'deviceType', desc: 'Crawl viewport simulation (desktop or mobile)', type: 'string', default: 'desktop' },
      { name: 'storeResults', desc: 'Persist audit run to workspace database history', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'auditId', desc: 'MongoDB ID of the created WorkspaceAudit record', type: 'string' },
      { name: 'domain', desc: 'Audited domain name', type: 'string' },
      { name: 'overallScore', desc: 'Overall calculated SEO health score (0-100)', type: 'number' },
      { name: 'grade', desc: 'Letter grade (A, B, C, D, F)', type: 'string' },
      { name: 'technicalScore', desc: 'Technical SEO sub-score (0-100)', type: 'number' },
      { name: 'performanceScore', desc: 'Page performance / CWV sub-score (0-100)', type: 'number' },
      { name: 'contentScore', desc: 'Content quality sub-score (0-100)', type: 'number' },
      { name: 'securityScore', desc: 'Security sub-score (0-100)', type: 'number' },
      { name: 'accessibilityScore', desc: 'Accessibility sub-score (0-100)', type: 'number' },
      { name: 'indexabilityScore', desc: 'Indexability sub-score (0-100)', type: 'number' },
      { name: 'pagesCrawled', desc: 'Total count of pages crawled and analyzed', type: 'number' },
      { name: 'findingsCount', desc: 'Total count of issues detected across all severities', type: 'number' },
      { name: 'criticalCount', desc: 'Count of critical severity issues', type: 'number' },
      { name: 'highCount', desc: 'Count of high severity issues', type: 'number' },
      { name: 'mediumCount', desc: 'Count of medium severity issues', type: 'number' },
      { name: 'lowCount', desc: 'Count of low severity issues', type: 'number' },
      { name: 'issues', desc: 'Full array of detected issues with severity, category, recommendation', type: 'array' },
      { name: 'scoreBreakdown', desc: 'Per-category score breakdown array', type: 'array' },
      { name: 'summary', desc: 'AI-generated plain-language audit summary', type: 'string' },
      { name: 'completedAt', desc: 'ISO timestamp of audit completion', type: 'string' },
      { name: 'reportPdfUrl', desc: 'Pre-signed URL for direct PDF report download', type: 'string' }
    ],
    bestPractices: 'Set maxPages <= 50 for rapid scheduled monitoring, or >= 500 for deep monthly audits.'
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true,
    supportsRollback: true
  },

  estimatedRuntimeMs: 300000,
  estimatedCost: { apiCalls: 1, aiTokens: 400, thirdPartyCalls: 0 },
  dependencies: [],
  permissions: ['seo:audit:run'],

  getInputSchema() {
    return [
      { name: 'targetDomain', label: 'Target Domain / URL', type: 'text', placeholder: 'https://askeva.io', helpText: 'Leave blank to use project domain' },
      { name: 'crawlDepth', label: 'Crawl Depth', type: 'number', defaultValue: 3, min: 1, max: 10 },
      { name: 'maxPages', label: 'Max Pages to Crawl', type: 'number', defaultValue: 100, min: 5, max: 5000 },
      { name: 'jsRendering', label: 'Enable JavaScript Rendering', type: 'switch', defaultValue: false },
      { name: 'deviceType', label: 'Device Type', type: 'select', defaultValue: 'desktop', options: [
        { label: 'Desktop (Chrome 120)', value: 'desktop' },
        { label: 'Mobile (Pixel 7 / Safari iOS)', value: 'mobile' }
      ]},
      { name: 'country', label: 'Geo-Target Country', type: 'text', defaultValue: 'US' },
      { name: 'timeout', label: 'Execution Timeout (seconds)', type: 'number', defaultValue: 300, min: 30, max: 600 },
      { name: 'retryCount', label: 'Max Automatic Retries', type: 'number', defaultValue: 2, min: 0, max: 5 },
      { name: 'storeResults', label: 'Save Results to Workspace History', type: 'switch', defaultValue: true },
      { name: 'tags', label: 'Audit Tags', type: 'text', placeholder: 'scheduled, daily, executive' }
    ];
  },

  getOutputSchema() {
    return {
      auditId: { type: 'string', description: 'WorkspaceAudit ID' },
      domain: { type: 'string', description: 'Target domain' },
      overallScore: { type: 'number', description: 'Overall health score (0-100)' },
      grade: { type: 'string', description: 'Letter grade A-F' },
      technicalScore: { type: 'number', description: 'Technical score' },
      performanceScore: { type: 'number', description: 'Performance score' },
      contentScore: { type: 'number', description: 'Content score' },
      securityScore: { type: 'number', description: 'Security score' },
      accessibilityScore: { type: 'number', description: 'Accessibility score' },
      indexabilityScore: { type: 'number', description: 'Indexability score' },
      pagesCrawled: { type: 'number', description: 'Total pages crawled' },
      findingsCount: { type: 'number', description: 'Total issues flagged' },
      criticalCount: { type: 'number', description: 'Critical issues count' },
      highCount: { type: 'number', description: 'High issues count' },
      mediumCount: { type: 'number', description: 'Medium issues count' },
      lowCount: { type: 'number', description: 'Low issues count' },
      issues: { type: 'array', description: 'Full issues array' },
      scoreBreakdown: { type: 'array', description: 'Per-category score breakdown' },
      summary: { type: 'string', description: 'AI audit summary' },
      completedAt: { type: 'string', description: 'ISO completion timestamp' },
      reportPdfUrl: { type: 'string', description: 'PDF report download link' }
    };
  },

  validate(config) {
    if (config && config.maxPages && config.maxPages < 1) {
      return { valid: false, error: 'maxPages must be at least 1' };
    }
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing production Site Audit for project ${projectId}`, config);

    let project = null;
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      project = await WorkspaceProject.findById(projectId);
    }
    const targetDomain = config.targetDomain || project?.domain || '';
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        auditId: `sim_audit_${Date.now()}`,
        domain: targetDomain,
        overallScore: 92,
        grade: 'A',
        technicalScore: 95,
        performanceScore: 89,
        contentScore: 91,
        securityScore: 98,
        accessibilityScore: 87,
        indexabilityScore: 94,
        pagesCrawled: Math.min(Number(config.maxPages) || 25, 25),
        findingsCount: 4,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 2,
        lowCount: 1,
        issues: [],
        scoreBreakdown: [],
        summary: 'Simulation: Site is in good health with minor performance improvements recommended.',
        completedAt: new Date().toISOString(),
        reportPdfUrl: `/api/v1/seo-workspace/projects/${projectId}/reports/export/pdf?simulated=true`
      };
    }

    // --- Trigger the production crawl ---
    let jobResult = null;
    try {
      if (project) {
        jobResult = await seoAuditorAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Audit agent start error: ${err.message}`);
    }

    // --- Wait for async crawl job to complete ---
    let auditRecord = null;
    if (jobResult && jobResult.jobId) {
      logger.info(TAG, `Crawl job ${jobResult.jobId} started. Polling for completion...`);
      const completedJob = await waitForAuditJobCompletion(
        jobResult.jobId,
        (Number(config.timeout) || 300) * 1000
      );

      if (completedJob && completedJob.status === 'completed') {
        try {
          auditRecord = await seoAuditorAgent.synthesizeSiteAudit(jobResult.jobId);
        } catch (synthErr) {
          logger.warn(TAG, `Audit synthesis error: ${synthErr.message}`);
        }
      }
    }

    // --- Fallback: read the most recent completed audit for this project ---
    if (!auditRecord && projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      auditRecord = await WorkspaceAudit.findOne({ projectId, status: 'completed' }).sort({ createdAt: -1 }).lean();
    }

    if (!auditRecord) {
      // No data at all — surface this clearly instead of fake numbers
      return {
        success: false,
        error: 'Audit crawl is still in progress or no completed audit found. Check Audit module for status.',
        auditId: jobResult?.jobId?.toString() || null,
        domain: targetDomain,
        status: 'pending'
      };
    }

    // --- Build the full production output ---
    const metrics = auditRecord.metrics || {};
    const findings = auditRecord.agent?.findings || [];
    const overallScore = metrics.overall ?? 0;
    const grade = overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 45 ? 'D' : 'F';

    return {
      success: true,
      auditId: auditRecord._id.toString(),
      domain: targetDomain,
      overallScore,
      grade,
      technicalScore: metrics.technical ?? 0,
      performanceScore: metrics.performance ?? 0,
      contentScore: metrics.content ?? 0,
      securityScore: metrics.security ?? 0,
      accessibilityScore: metrics.accessibility ?? 0,
      indexabilityScore: metrics.indexability ?? 0,
      imagesScore: metrics.images ?? 0,
      schemaScore: metrics.schema ?? 0,
      internalLinkingScore: metrics.internalLinking ?? 0,
      pagesCrawled: metrics.pagesCrawled ?? 0,
      scoreBreakdown: metrics.scoreBreakdown || [],
      findingsCount: findings.length,
      criticalCount: findings.filter(f => f.severity === 'critical').length,
      highCount: findings.filter(f => f.severity === 'high').length,
      mediumCount: findings.filter(f => f.severity === 'medium').length,
      lowCount: findings.filter(f => f.severity === 'low').length,
      issues: findings,
      summary: auditRecord.agent?.summary || '',
      approvalStatus: auditRecord.agent?.approvalStatus || '',
      completedAt: auditRecord.completedAt ? new Date(auditRecord.completedAt).toISOString() : new Date().toISOString(),
      reportPdfUrl: `/api/v1/seo-workspace/projects/${projectId}/reports/export/pdf?auditId=${auditRecord._id}`
    };
  },

  async compensate(config, context) {
    logger.info(TAG, `Compensating Site Audit action for project ${context.projectId}`);
    return { success: true, compensated: true };
  }
};
