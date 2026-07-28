/**
 * Reporting Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Mirrors the same two-phase shape as seoAuditorAgent.service.js /
 * keywordResearchAgent.service.js / competitorAgent.service.js:
 *   1. collectReportData()  – gathers objective data already produced by
 *      the other agents/modules for this project (latest WorkspaceAudit,
 *      Approved WorkspaceKeywords, Approved WorkspaceCompetitors,
 *      WorkspaceTask status counts). No AI, no new data collection —
 *      every source here is an existing model, queried read-only.
 *   2. generateReport()      – the actual "agent" step: an AI call with
 *      this agent's own prompt (seo-report-writing + executive-summary
 *      skills) turns that data into a client-facing Markdown report plus
 *      a short executive summary. The resulting WorkspaceReport starts
 *      life at agent.approvalStatus 'Pending Approval' — same Gate
 *      pattern as the other three agents — before it counts as
 *      client-ready.
 *
 * Relationship to the existing orchestrator:
 *   workspaceAgentOrchestrator.service.js already has its own
 *   `seoReporterAgent(projectId, auditDiff, scheduleOptions)` that builds a
 *   WorkspaceReport directly from an audit diff, with its own private AI
 *   client, no retry/logging/gate, and `status: 'completed'` set
 *   immediately (no human review). That method is NOT modified or removed
 *   here (out of scope for this pass, same "known open item" treatment
 *   already given to the orchestrator's inline keyword-fetch step — see
 *   this module's aiCore/README.md and the seo-agents memory notes).
 *   This agent is additive: it reuses the same WorkspaceReport
 *   model/collection but is a distinct, gated code path a caller opts into
 *   by calling reportingAgent.run() instead of the orchestrator method.
 *
 * Reuse decisions (same as the other three agents — nothing here is new
 * infra, all wiring onto what already exists):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue, under a distinct key so a reporting-agent run never
 *     blocks (or is blocked by) an auditor/keyword/competitor run for the
 *     same project.
 *   - Shared memory: recalled before generation (so prior report-writing
 *     feedback — tone corrections, "don't lead with declining traffic",
 *     etc. — steers the AI's writing); written to when a report is
 *     rejected with a reason, so future runs' prompts carry that context.
 *   - Reuses the existing 'seo-reporter' agentLoader key (already defined
 *     with skills ['seo-report-writing', 'executive-summary']) instead of
 *     registering a new agent key — those two skill files did not exist
 *     yet on disk (agentLoader referenced them but skillLoader silently
 *     returns '' for a missing skill folder), so they were added under
 *     seoWorkspace/skills/, not invented as new agent config.
 *   - No new collection: WorkspaceReport already exists for exactly this
 *     purpose. Its approval-gate fields (source, agent.*) are additive —
 *     see workspaceReport.model.js's header comment — every pre-existing
 *     report defaults to source 'manual' / agent.approvalStatus
 *     'Not Requested' and is completely unaffected.
 *
 * Retry, distinct from aiCore's automatic transient-error retry inside
 * aiEngine.complete: if a run's data-collection or generation step throws
 * after aiEngine's own retries are exhausted, run() persists a 'failed'
 * WorkspaceReport doc (not just a thrown error) so there is something a
 * human/operator can see and act on. retryReport() re-attempts generation
 * for that exact doc in place (same _id — not a duplicate), still gated
 * behind executionQueue and still logged.
 */
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceReport = require('../models/workspaceReport.model');
const WorkspaceAudit = require('../models/workspaceAudit.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceCompetitor = require('../models/workspaceCompetitor.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'seo-reporter';
const TAG = 'ReportingAgent';

const VALID_REPORT_TYPES = ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive', 'executive_summary'];
const TOP_KEYWORDS_LIMIT = 10;
const TOP_COMPETITORS_LIMIT = 5;

/**
 * Phase 1: objective data collection. No AI involved — every source here
 * is an existing, already-populated model, queried read-only.
 *
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<Object>} { audit, keywords, competitors, taskCounts }
 */
async function collectReportData(project) {
  const [audit, keywords, competitors, taskCounts] = await Promise.all([
    WorkspaceAudit.findOne({ projectId: project._id }).sort({ createdAt: -1 }).lean(),
    WorkspaceKeyword.find({ projectId: project._id, isDeleted: false, status: 'Approved' })
      .sort({ 'metrics.searchVolume': -1 })
      .limit(TOP_KEYWORDS_LIMIT)
      .lean(),
    WorkspaceCompetitor.find({ projectId: project._id, isDeleted: false, status: 'Approved' })
      .sort({ 'metrics.organicTraffic': -1 })
      .limit(TOP_COMPETITORS_LIMIT)
      .lean(),
    WorkspaceTask.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const taskCountsByStatus = taskCounts.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    audit: audit ? {
      completedAt: audit.completedAt,
      metrics: audit.metrics,
      issues: audit.issues,
      summary: audit.agent?.summary || null,
      findingCount: audit.agent?.findings?.length || 0
    } : null,
    keywords: keywords.map((k) => ({
      keyword: k.keyword,
      searchVolume: k.metrics?.searchVolume || 0,
      currentRank: k.ranking?.currentRank ?? null,
      previousRank: k.ranking?.previousRank ?? null
    })),
    competitors: competitors.map((c) => ({
      domain: c.domain,
      threatLevel: c.agent?.threatLevel || 'medium',
      organicTraffic: c.metrics?.organicTraffic || 0
    })),
    taskCounts: {
      pending: taskCountsByStatus.Pending || 0,
      approved: taskCountsByStatus.Approved || 0,
      implemented: taskCountsByStatus.Implemented || 0,
      rejected: taskCountsByStatus.Rejected || 0,
      failed: taskCountsByStatus.Failed || 0
    }
  };
}

/**
 * Phase 2: the actual agent step. Own prompt; turns the collected data into
 * a client-facing Markdown report plus a short executive summary. Explicit
 * about which sections have no data rather than fabricating figures — the
 * seo-report-writing skill enforces this, but the prompt restates it since
 * report content is what a client actually sees.
 *
 * @param {Object} project
 * @param {Object} data - from collectReportData
 * @param {string} workspaceId
 * @returns {Promise<{ markdown: string, executiveSummary: string, dataSources: string[] }>}
 */
async function generateReport(project, data, workspaceId) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const dataSources = [];
  if (data.audit) dataSources.push('audit');
  if (data.keywords.length > 0) dataSources.push('keywords');
  if (data.competitors.length > 0) dataSources.push('competitors');
  dataSources.push('tasks');

  const prompt = `You are the Reporting Agent for ${project.name} (${project.domain}).

Data available (fields absent or empty mean no data has been collected/approved yet for that area — say so plainly rather than estimating):
${JSON.stringify(data, null, 2)}
${skillsBlock}
${memoryBlock}

Produce a client-facing SEO status report from the data above only. Do not invent metrics that aren't present in the data.

Respond with a JSON object of this exact shape:
{
  "executiveSummary": "3-5 sentence executive summary",
  "markdownReport": "full Markdown report body"
}
Respond ONLY with valid JSON, no markdown code fences around the JSON itself.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.5,
    maxTokens: 2200,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI report JSON: ${error.message}`, { projectId: project._id });
    throw new Error('Reporting Agent: AI response was not valid JSON, report generation failed.');
  }

  if (!parsed.markdownReport) {
    throw new Error('Reporting Agent: AI response did not include a markdownReport.');
  }

  return {
    markdown: parsed.markdownReport,
    executiveSummary: parsed.executiveSummary || '',
    dataSources
  };
}

/**
 * Full agent run: collect + generate + persist a new WorkspaceReport at
 * agent.approvalStatus 'Pending Approval', serialized per-project through
 * Execution Queue (own key, distinct from the other three agents' keys).
 * Logs a run-level execution entry (source: 'reportingAgent') alongside
 * aiEngine's own per-AI-call entries. On failure, persists a 'failed'
 * WorkspaceReport doc instead of only throwing, so retryReport() has
 * something concrete to retry.
 *
 * @param {string} projectId
 * @param {Object} [options]
 * @param {string} [options.reportType='comprehensive'] - one of VALID_REPORT_TYPES
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the created WorkspaceReport doc (lean)
 */
async function run(projectId, options = {}, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const reportType = VALID_REPORT_TYPES.includes(options.reportType) ? options.reportType : 'comprehensive';
  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`reporting-agent:${projectId}`, async () => {
    const executionId = `reportingAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    let reportDoc;
    try {
      const data = await collectReportData(project);
      const { markdown, executiveSummary, dataSources } = await generateReport(project, data, agencyId);

      reportDoc = await WorkspaceReport.create({
        projectId,
        agencyId,
        clientId: project.clientId || project.createdBy,
        name: `${project.name} — SEO Report (${new Date().toISOString().slice(0, 10)})`,
        type: reportType,
        format: 'markdown',
        content: markdown,
        status: 'completed',
        source: 'reporting-agent',
        createdBy: project.createdBy || project.companyId,
        agent: {
          agentKey: AGENT_KEY,
          dataSources,
          summary: executiveSummary,
          approvalStatus: 'Pending Approval'
        }
      });

      logger.logExecution({
        executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { reportId: reportDoc._id }
      });

      return reportDoc.toObject();
    } catch (error) {
      logger.logExecution({
        executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });

      // Persist a failed report record (best-effort) so retryReport() has
      // something to act on — a thrown error alone leaves no trace a human
      // can find and retry from later.
      try {
        reportDoc = await WorkspaceReport.create({
          projectId,
          agencyId,
          clientId: project.clientId || project.createdBy,
          name: `${project.name} — SEO Report (${new Date().toISOString().slice(0, 10)})`,
          type: reportType,
          format: 'markdown',
          status: 'failed',
          source: 'reporting-agent',
          createdBy: project.createdBy || project.companyId,
          agent: { agentKey: AGENT_KEY, approvalStatus: 'Not Requested' }
        });
      } catch (persistError) {
        logger.error(TAG, `Failed to persist failed-report record: ${persistError.message}`, { projectId });
      }

      throw error;
    }
  });
}

/**
 * Retry — distinct from aiCore's automatic transient-error retry inside
 * aiEngine.complete (which already handles transient failures within a
 * single run). This re-attempts generation for an existing 'failed'
 * WorkspaceReport in place (same _id, no duplicate), still serialized
 * through Execution Queue under the same per-project key as run().
 *
 * @param {string} reportId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the updated WorkspaceReport doc (lean)
 */
async function retryReport(reportId, workspaceId) {
  const report = await WorkspaceReport.findById(reportId);
  if (!report) throw new Error('Report not found');
  if (report.status !== 'failed') {
    throw new Error(`Reporting Agent: only a 'failed' report can be retried (current status: ${report.status})`);
  }

  const project = await WorkspaceProject.findById(report.projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || report.agencyId || project.createdBy || project.companyId;

  return executionQueue.run(`reporting-agent:${report.projectId}`, async () => {
    const executionId = `reportingAgent:retry:${report.projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId: report.projectId, status: 'started', meta: { retry: true, reportId } });

    try {
      const data = await collectReportData(project);
      const { markdown, executiveSummary, dataSources } = await generateReport(project, data, agencyId);

      report.content = markdown;
      report.status = 'completed';
      report.agent = {
        agentKey: AGENT_KEY,
        dataSources,
        summary: executiveSummary,
        approvalStatus: 'Pending Approval'
      };
      await report.save();

      logger.logExecution({
        executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId: report.projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt, meta: { retry: true, reportId }
      });

      return report.toObject();
    } catch (error) {
      logger.logExecution({
        executionId, source: 'reportingAgent', agentKey: AGENT_KEY, projectId: report.projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message, meta: { retry: true, reportId }
      });
      // Leave the doc at status 'failed' (it already was) so it remains
      // discoverable/retryable rather than being deleted or hidden.
      throw error;
    }
  });
}

/**
 * Human Approval Gate — approve path. Only a report at 'Pending Approval'
 * for this project can move to 'Approved'.
 *
 * @param {string} reportId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveReport(reportId, projectId, userId) {
  const result = await WorkspaceReport.updateOne(
    { _id: reportId, projectId, 'agent.approvalStatus': 'Pending Approval' },
    {
      $set: {
        'agent.approvalStatus': 'Approved',
        'agent.approvedBy': userId,
        'agent.approvedAt': new Date(),
        'agent.rejectionReason': null
      }
    }
  );

  auditLogService.record({
    targetType: 'Report', targetId: reportId, projectId,
    action: 'report_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return result;
}

/**
 * Human Approval Gate — reject path. Rejected reports stay in the
 * collection (not deleted). A given reason is recorded to shared memory so
 * future report-generation prompts for this project/agency carry that
 * feedback — one rejection is already a clear, specific signal (same
 * reasoning as competitorAgent's per-rejection memory write).
 *
 * @param {string} reportId
 * @param {string} projectId
 * @param {string} userId
 * @param {string} [reason]
 */
async function rejectReport(reportId, projectId, userId, reason) {
  const result = await WorkspaceReport.updateOne(
    { _id: reportId, projectId, 'agent.approvalStatus': 'Pending Approval' },
    {
      $set: {
        'agent.approvalStatus': 'Rejected',
        'agent.rejectionReason': reason || null
      }
    }
  );

  auditLogService.record({
    targetType: 'Report', targetId: reportId, projectId,
    action: 'report_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  if (reason) {
    await recordReportFeedbackIfAny(projectId, reason, userId);
  }

  return result;
}

/**
 * Shared Memory write-side: best-effort, never breaks rejection if it fails.
 */
async function recordReportFeedbackIfAny(projectId, reason, userId) {
  try {
    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    await sharedMemory.remember({
      agencyId,
      projectId,
      title: 'Report feedback from a rejected report',
      description: 'A generated SEO report was rejected on human review.',
      content: `A prior report for this project was rejected. Reason given: ${reason}`,
      type: 'do_not_do'
    });
  } catch (error) {
    logger.warn(TAG, `Failed to record report-feedback memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * Own execution history, read-side. Same shape as the other three agents'
 * equivalent — queries aiCore's ExecutionLog for both this agent's
 * run-level entries and its underlying AI-call entries.
 *
 * @param {string} projectId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'reportingAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  retryReport,
  collectReportData,
  generateReport,
  approveReport,
  rejectReport,
  getExecutionHistory
};
