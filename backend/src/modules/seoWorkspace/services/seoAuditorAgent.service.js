const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceAudit = require('../models/workspaceAudit.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const dataForSeoService = require('../../seoIntelligence/dataForSeo.service');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');
const WorkspaceAuditJob = require('../models/workspaceAuditJob.model');
const WorkspaceAuditQueue = require('../models/workspaceAuditQueue.model');
const WorkspaceAuditPage = require('../models/workspaceAuditPage.model');

const AGENT_KEY = 'seo-auditor';
const TAG = 'SeoAuditorAgent';

const VALID_TASK_TYPES = ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking'];
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const MAX_FINDINGS = 15;

/**
 * @param {Object} project - a WorkspaceProject document
 * @param {string} agencyId
 * @param {number} [maxCrawlPages=5] - passed through to DataForSEO's on-page task
 * @returns {Promise<Object>} saved WorkspaceAudit document
 */
async function collectRawAudit(project, agencyId, maxCrawlPages = 5) {
  const domain = project.domain.replace(/^https?:\/\/(www\.)?/, '');
  let newAudit = null;

  if (dataForSeoService.isConfigured) {
    try {
      const auditResponse = await retry.withRetry(
        () => dataForSeoService.runOnPageAudit(domain, maxCrawlPages),
        {
          retries: 2,
          retryIf: (error) => !/invalid|not found/i.test(error.message || ''),
          onRetry: (error, attempt) => logger.warn(TAG, `DataForSEO retry ${attempt + 1} for ${domain}: ${error.message}`)
        }
      );
      const result = auditResponse?.result;

      if (result) {
        const score = Math.round(result.page_metrics?.onpage_score || 0);
        const metrics = result.page_metrics || {};
        const checks = metrics.checks || {};

        newAudit = await WorkspaceAudit.create({
          projectId: project._id,
          agencyId,
          taskId: auditResponse.id || 'agent-run',
          status: 'completed',
          metrics: {
            onpageScore: score,
            technicalScore: score,
            pagesCrawled: 1,
            performance: score,
            crawlability: score,
            security: score,
            onPage: score,
            overall: score
          },
          issues: {
            brokenLinks: metrics.broken_links || 0,
            missingMeta: (checks.no_title || 0) + (checks.no_description || 0),
            slowPages: checks.high_loading_time || 0
          },
          completedAt: new Date()
        });
      }
    } catch (error) {
      logger.warn(TAG, `DataForSEO on-page audit failed for ${domain}, falling back to internal crawler: ${error.message}`, { projectId: project._id });
    }
  }

  if (!newAudit) {
    const crawler = new CrawlService(project.domain, 50);
    const crawlResult = await retry.withRetry(() => crawler.run(), { retries: 1 });
    const summary = crawlResult.summary;

    const totalElements = summary.total_urls * 3;
    const missingElements = (summary.missing_title || 0) + (summary.missing_meta_description || 0) + (summary.missing_h1 || 0);
    const onPageScore = summary.total_urls > 0 ? Math.max(0, Math.round(((totalElements - missingElements) / totalElements) * 100)) : 0;
    const crawlability = summary.total_urls > 0 ? Math.round((summary.status_200 / summary.total_urls) * 100) : 0;

    newAudit = await WorkspaceAudit.create({
      projectId: project._id,
      agencyId,
      taskId: `crawl_${Date.now()}`,
      status: 'completed',
      metrics: {
        onpageScore: onPageScore,
        technicalScore: onPageScore,
        pagesCrawled: summary.total_urls || 0,
        performance: crawlability,
        crawlability,
        security: project.domain.startsWith('https') ? 100 : 0,
        onPage: onPageScore,
        mobileUsability: 60,
        overall: Math.round((crawlability + onPageScore) / 2)
      },
      issues: {
        missingMeta: (summary.missing_title || 0) + (summary.missing_meta_description || 0),
        slowPages: summary.thin_content_lt_300_words || 0
      },
      completedAt: new Date()
    });
  }

  await WorkspaceProject.findByIdAndUpdate(project._id, {
    $set: {
      'stats.lastAuditScore': newAudit.metrics.overall || newAudit.metrics.onpageScore,
      lastAuditSync: new Date(),
      phase: 'audit'
    }
  });

  return newAudit;
}

/**
 * @param {Object} project - WorkspaceProject document
 * @param {Object} audit - WorkspaceAudit document (from collectRawAudit)
 * @param {string} workspaceId - tenant scope for AI key lookup + shared memory
 * @returns {Promise<Object>} the same audit document, now with `agent` populated
 */
async function analyzeAudit(project, audit, workspaceId) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const prompt = `You are the SEO Auditor. Analyze the following automated audit output for ${project.name} (${project.domain}) and produce a prioritized set of findings a human reviewer can act on.

Audit Metrics:
${JSON.stringify(audit.metrics, null, 2)}

Issue Counts:
${JSON.stringify(audit.issues, null, 2)}
${skillsBlock}
${memoryBlock}

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence plain-language summary of overall site health",
  "findings": [
    {
      "category": "broken_links | missing_meta | slow_pages | canonical_issues | ssl_issues | thin_content | other",
      "severity": "critical | high | medium | low",
      "issue": "specific description of the problem",
      "recommendation": "specific, actionable next step",
      "aiExplanation": "detailed explanation of why this is an issue and how it impacts SEO",
      "generatedFix": "safe code or content snippet that can be applied to fix the issue",
      "htmlPreview": "a snippet of the affected HTML code (if applicable)",
      "taskType": "Update Meta Tags | Content Edit | Schema Injection | Create Redirect | Internal Linking",
      "pageUrl": "affected page path, or the site root if not page-specific"
    }
  ]
}
Return at most ${MAX_FINDINGS} findings, ranked by likely impact. Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.4,
    maxTokens: 2500, // increased to allow for explanations and code snippets
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI findings JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated analysis did not return structured output; manual review recommended.', findings: [] };
  }

  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.slice(0, MAX_FINDINGS).map((f) => ({
      category: f.category || 'other',
      severity: VALID_SEVERITIES.includes(f.severity) ? f.severity : 'medium',
      issue: f.issue || 'Unspecified issue',
      recommendation: f.recommendation || '',
      aiExplanation: f.aiExplanation || null,
      generatedFix: f.generatedFix || null,
      htmlPreview: f.htmlPreview || null,
      taskType: VALID_TASK_TYPES.includes(f.taskType) ? f.taskType : 'Content Edit',
      pageUrl: f.pageUrl || project.domain
    }))
    : [];

  audit.agent = {
    agentKey: AGENT_KEY,
    summary: parsed.summary || '',
    findings,
    approvalStatus: findings.length > 0 ? 'Pending Approval' : 'Not Requested',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    generatedTaskIds: []
  };

  await audit.save();
  return audit;
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId] - falls back to the project's own tenant fields if omitted
 * @param {Object} [options]
 * @param {string} [options.profile] - quick, standard, deep, custom
 * @returns {Promise<Object>} the running job info
 */
async function run(projectId, workspaceId, options = {}, userId = 'system') {
  logger.info(TAG, `[Audit Start Request] Project ID: ${projectId} | User ID: ${userId} | Profile: ${options.profile || 'standard'}`);
  
  try {
    const project = await WorkspaceProject.findById(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.domain) throw new Error('Project domain is not configured');

    const agencyId = workspaceId || project.createdBy || project.companyId;
    const profile = options.profile || 'standard';

    // 1. Check if an audit job is already running
    const existingJob = await WorkspaceAuditJob.findOne({ projectId: project._id, status: 'running' });
    if (existingJob) {
      logger.info(TAG, `Existing running job found: ${existingJob._id}`);
      return { status: 'running', jobId: existingJob._id, progress: existingJob.progress };
    }

    // 2. Create Audit Job
    logger.info(TAG, `Creating Audit Job...`);
    const job = await WorkspaceAuditJob.create({
      projectId: project._id,
      agencyId,
      profile,
      status: 'running',
      startedAt: new Date(),
      progress: { urlsDiscovered: 1, urlsRemaining: 1 }
    });
    logger.info(TAG, `Audit Job Created: ${job._id}`);

    // 3. Enqueue Root URL
    const siteUrl = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
    logger.info(TAG, `Enqueueing root URL: ${siteUrl}`);
    await WorkspaceAuditQueue.create({
      jobId: job._id,
      url: siteUrl,
      depth: 0,
      status: 'pending'
    });

    // 4. Start the worker manually if needed
    try {
      logger.info(TAG, `Starting worker...`);
      const enterpriseCrawlWorker = require('./enterpriseCrawl.worker.js');
      if (!enterpriseCrawlWorker.isRunning) enterpriseCrawlWorker.start();
    } catch(e) {
      logger.error(TAG, `Failed to nudge enterprise crawl worker: ${e.message}`);
    }

    logger.logExecution({ 
      executionId: `seoAuditorAgent:${projectId}:${Date.now()}`, 
      source: 'seoAuditorAgent', 
      agentKey: AGENT_KEY, 
      projectId, 
      status: 'started',
      meta: { jobId: job._id, profile }
    });

    return { status: 'queued', jobId: job._id };
  } catch (error) {
    logger.error(TAG, `[Audit Start Failed] Project: ${projectId} | Error: ${error.message}\nStack: ${error.stack}`);
    throw error;
  }
}

/**
 * Run Site-wide AI Analysis on Completed Audit Job
 */
async function synthesizeSiteAudit(jobId) {
  const job = await WorkspaceAuditJob.findById(jobId).populate('projectId');
  if (!job || !job.projectId) throw new Error('Job/Project not found');

  const project = job.projectId;
  const agencyId = job.agencyId;

  // Aggregate results from WorkspaceAuditPage
  const pages = await WorkspaceAuditPage.find({ jobId: job._id }).lean();
  
  const totalPages = pages.length || 1;
  const crawlability = Math.round((pages.filter(p => p.statusCode === 200).length / totalPages) * 100);
  
  const issues = {
    missingMeta: pages.filter(p => p.checks?.missingTitle || p.checks?.missingDescription).length,
    missingH1: pages.filter(p => p.checks?.missingH1).length,
    thinContent: pages.filter(p => p.checks?.thinContent).length,
    brokenLinks: pages.reduce((sum, p) => sum + (p.checks?.brokenLinksCount || 0), 0)
  };
  
  const onPageScore = Math.max(0, 100 - (issues.missingMeta + issues.missingH1) * 2);

  const rawAudit = await WorkspaceAudit.create({
    projectId: project._id,
    agencyId,
    taskId: job._id,
    status: 'completed',
    metrics: {
      onpageScore: onPageScore,
      technicalScore: crawlability,
      pagesCrawled: pages.length,
      performance: crawlability,
      crawlability,
      security: project.domain.startsWith('https') ? 100 : 0,
      onPage: onPageScore,
      overall: Math.round((crawlability + onPageScore) / 2)
    },
    issues: {
      brokenLinks: issues.brokenLinks,
      missingMeta: issues.missingMeta,
      slowPages: issues.thinContent
    },
    completedAt: new Date()
  });

  // Call the AI Analyzer
  const analyzed = await analyzeAudit(project, rawAudit, agencyId);
  return analyzed;
}

/**
 * @param {string} auditId
 * @param {string} projectId
 * @param {string} userId - reviewer, for the audit trail
 */
async function approveFindings(auditId, projectId, userId) {
  const audit = await WorkspaceAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('Audit not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Findings must be 'Pending Approval' to approve. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Approved';
  audit.agent.approvedBy = userId;
  audit.agent.approvedAt = new Date();
  audit.agent.rejectionReason = null;

  const tasksToCreate = (audit.agent.findings || [])
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .map((f) => ({
      projectId,
      pageUrl: f.pageUrl || '/',
      taskType: f.taskType,
      description: `[SEO Auditor] ${f.issue}${f.recommendation ? ' — ' + f.recommendation : ''}`,
      proposedChanges: { category: f.category, severity: f.severity, recommendation: f.recommendation },
      status: 'Pending'
    }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    audit.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await audit.save();

  auditLogService.record({
    targetType: 'Audit', targetId: audit._id, projectId,
    action: 'auditor_findings_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  await recordRecurringIssuesIfAny(audit, projectId, userId);

  return { audit, createdTasks };
}

async function rejectFindings(auditId, projectId, userId, reason) {
  const audit = await WorkspaceAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('Audit not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Findings must be 'Pending Approval' to reject. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Rejected';
  audit.agent.rejectionReason = reason || null;
  await audit.save();

  auditLogService.record({
    targetType: 'Audit', targetId: audit._id, projectId,
    action: 'auditor_findings_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  return audit;
}

async function recordRecurringIssuesIfAny(audit, projectId, userId) {
  try {
    const previous = await WorkspaceAudit.findOne({
      projectId,
      _id: { $ne: audit._id },
      'agent.approvalStatus': 'Approved'
    }).sort({ createdAt: -1 });

    if (!previous) return;

    const previousCategories = new Set((previous.agent?.findings || []).map((f) => f.category));
    const repeated = (audit.agent.findings || []).filter(
      (f) => previousCategories.has(f.category) && (f.severity === 'critical' || f.severity === 'high')
    );

    if (repeated.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const finding of repeated.slice(0, 3)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Recurring issue: ${finding.category}`,
        description: `The SEO Auditor Agent flagged "${finding.category}" as ${finding.severity} severity in consecutive approved audits.`,
        content: `Issue: ${finding.issue}\nRecommendation: ${finding.recommendation}`,
        type: 'recurring_issue'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record recurring-issue memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * @param {string} projectId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'seoAuditorAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectRawAudit,
  analyzeAudit,
  approveFindings,
  rejectFindings,
  getExecutionHistory
};