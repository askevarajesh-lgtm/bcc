const WorkspaceProject = require('../models/workspaceProject.model');
const { WorkspaceReport } = require('../models/workspaceReportAsset.model');
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
      throw error;
    }
  });
}

/**
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
