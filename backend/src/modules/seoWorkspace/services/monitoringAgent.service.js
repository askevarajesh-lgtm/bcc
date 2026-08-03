const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const DataForSeoService = require('../../seoIntelligence/dataForSeo.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'seo-monitor';
const TAG = 'MonitoringAgent';
const DROP_THRESHOLD = 2;
const MAX_ALERTS_PER_RUN = 10; // cap AI calls per run, same rationale as competitorAgent's enrichment cap
const NOT_FOUND_RANK = 100; // same "not found in top 100" convention the cron loop already uses
const VALID_TASK_TYPES = ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization'];

/**
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<Array<{ keyword: Object, dropAmount: number }>>}
 */
async function collectRankDrops(project) {
  if (!DataForSeoService.isConfigured) {
    logger.warn(TAG, `DataForSEO not configured, skipping rank check for project ${project._id} (no fabricated data)`, { projectId: project._id });
    return [];
  }

  const keywords = await WorkspaceKeyword.find({ projectId: project._id, isDeleted: false, status: 'Approved' });
  if (keywords.length === 0) return [];

  const tasks = keywords.map((kw) => ({
    keyword: kw.keyword,
    location_code: kw.locationCode || 2840,
    language_code: kw.languageCode || 'en'
  }));

  let serpResults;
  try {
    serpResults = await retry.withRetry(
      () => DataForSeoService.getSerpResults(tasks),
      {
        retries: 2,
        retryIf: (error) => !/invalid|not found/i.test(error.message || ''),
        onRetry: (error, attempt) => logger.warn(TAG, `getSerpResults retry ${attempt + 1} for project ${project._id}: ${error.message}`)
      }
    );
  } catch (error) {
    logger.warn(TAG, `getSerpResults failed for project ${project._id}, skipping this run: ${error.message}`, { projectId: project._id });
    return [];
  }

  const projectDomain = project.domain.replace(/^https?:\/\/(www\.)?/, '');
  const drops = [];

  for (const [index, kw] of keywords.entries()) {
    const previousRank = kw.ranking?.currentRank || 10; // same default the cron loop uses for a never-tracked keyword
    let currentRank = previousRank;

    const items = serpResults?.[index]?.result?.[0]?.items || [];
    const foundItem = items.find((item) => item.domain && item.domain.includes(projectDomain));
    currentRank = foundItem ? (foundItem.rank_absolute || foundItem.rank_group || currentRank) : NOT_FOUND_RANK;

    kw.ranking.previousRank = previousRank;
    kw.ranking.currentRank = currentRank;
    if (!kw.ranking.bestRank || currentRank < kw.ranking.bestRank) {
      kw.ranking.bestRank = currentRank;
    }
    await kw.save();

    const dropAmount = currentRank - previousRank;
    if (dropAmount >= DROP_THRESHOLD) {
      drops.push({ keyword: kw, dropAmount });
    }
  }

  return drops;
}

/**
 * @param {Object} project
 * @param {Object} keyword - a WorkspaceKeyword document
 * @param {number} dropAmount
 * @param {string} workspaceId
 * @returns {Promise<{ taskType: string, pageUrl: string, description: string, proposedChanges: Object, rationale: string }>}
 */
async function analyzeDrop(project, keyword, dropAmount, workspaceId) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const prompt = `You are the Monitoring Agent for ${project.name} (${project.domain}).

The keyword "${keyword.keyword}" dropped from rank ${keyword.ranking.previousRank} to rank ${keyword.ranking.currentRank} (a drop of ${dropAmount} positions). The page currently ranking for it: ${keyword.ranking.url || 'unknown'}.
${skillsBlock}
${memoryBlock}

Recommend exactly one specific recovery action.

Respond with a JSON object of this exact shape:
{
  "taskType": "Update Meta Tags" | "Content Edit" | "Schema Injection" | "Create Redirect" | "Internal Linking" | "Image Optimization",
  "pageUrl": "the specific ranking page path",
  "description": "short description of the problem and the proposed fix, for a non-technical reviewer",
  "proposedChanges": { "key": "value" },
  "rationale": "1-2 sentence justification grounded in the drop data given"
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.4,
    maxTokens: 700,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI drop-analysis JSON: ${error.message}`, { projectId: project._id, keyword: keyword.keyword });
    throw new Error('Monitoring Agent: AI response was not valid JSON, drop analysis failed.');
  }

  return {
    taskType: VALID_TASK_TYPES.includes(parsed.taskType) ? parsed.taskType : 'Content Edit',
    pageUrl: parsed.pageUrl || keyword.ranking?.url || `/${keyword.keyword.replace(/\s+/g, '-')}`,
    description: parsed.description || `Rank drop detected for "${keyword.keyword}" (${dropAmount} positions).`,
    proposedChanges: parsed.proposedChanges && typeof parsed.proposedChanges === 'object' ? parsed.proposedChanges : { action: 'Review content freshness' },
    rationale: parsed.rationale || ''
  };
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<{ droppedKeywordCount: number, createdTasks: Array, failures: Array }>}
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`monitoring-agent:${projectId}`, async () => {
    const executionId = `monitoringAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const drops = await collectRankDrops(project);
      const candidates = drops.slice(0, MAX_ALERTS_PER_RUN);

      const createdTasks = [];
      const failures = [];

      for (const { keyword, dropAmount } of candidates) {
        try {
          const analysis = await analyzeDrop(project, keyword, dropAmount, agencyId);

          const task = await WorkspaceTask.create({
            projectId: project._id,
            pageUrl: analysis.pageUrl,
            taskType: analysis.taskType,
            description: analysis.description,
            proposedChanges: analysis.proposedChanges,
            source: 'monitoring-agent',
            agent: {
              agentKey: AGENT_KEY,
              sourceKeywordId: keyword._id,
              dropAmount,
              rationale: analysis.rationale
            }
          });

          createdTasks.push(task.toObject());
        } catch (error) {
          logger.logExecution({
            executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId,
            status: 'failed', error: error.message, meta: { keywordId: keyword._id, keyword: keyword.keyword }
          });
          failures.push({ keywordId: keyword._id, keyword: keyword.keyword, error: error.message });
        }
      }

      logger.logExecution({
        executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { droppedKeywordCount: drops.length, createdCount: createdTasks.length, failureCount: failures.length }
      });

      return { droppedKeywordCount: drops.length, createdTasks, failures };
    } catch (error) {
      logger.logExecution({
        executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} projectId
 * @param {string} keywordId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the created WorkspaceTask doc (lean)
 */
async function retryDropAnalysis(projectId, keywordId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const keyword = await WorkspaceKeyword.findOne({ _id: keywordId, projectId });
  if (!keyword) throw new Error('Keyword not found for this project');

  const dropAmount = (keyword.ranking?.currentRank || 0) - (keyword.ranking?.previousRank || 0);
  if (dropAmount < DROP_THRESHOLD) {
    throw new Error(`Monitoring Agent: keyword's current stored ranking does not reflect a drop >= ${DROP_THRESHOLD} (${dropAmount}); nothing to retry.`);
  }

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`monitoring-agent:${projectId}`, async () => {
    const executionId = `monitoringAgent:retry:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId, status: 'started', meta: { retry: true, keywordId } });

    try {
      const analysis = await analyzeDrop(project, keyword, dropAmount, agencyId);

      const task = await WorkspaceTask.create({
        projectId: project._id,
        pageUrl: analysis.pageUrl,
        taskType: analysis.taskType,
        description: analysis.description,
        proposedChanges: analysis.proposedChanges,
        source: 'monitoring-agent',
        agent: { agentKey: AGENT_KEY, sourceKeywordId: keyword._id, dropAmount, rationale: analysis.rationale }
      });

      logger.logExecution({
        executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt, meta: { retry: true, keywordId, taskId: task._id }
      });

      return task.toObject();
    } catch (error) {
      logger.logExecution({
        executionId, source: 'monitoringAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message, meta: { retry: true, keywordId }
      });
      throw error;
    }
  });
}

/**
 * @param {string} taskId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveTask(taskId, projectId, userId) {
  const result = await WorkspaceTask.updateOne(
    { _id: taskId, projectId, status: 'Pending', 'agent.agentKey': AGENT_KEY },
    { $set: { status: 'Approved', failureReason: null } }
  );

  auditLogService.record({
    targetType: 'Task', targetId: taskId, projectId,
    action: 'monitoring_task_approved', fromValue: 'Pending', toValue: 'Approved', userId
  });

  return result;
}

/**
 * @param {string} taskId
 * @param {string} projectId
 * @param {string} userId
 * @param {string} [reason]
 */
async function rejectTask(taskId, projectId, userId, reason) {
  const result = await WorkspaceTask.updateOne(
    { _id: taskId, projectId, status: 'Pending', 'agent.agentKey': AGENT_KEY },
    { $set: { status: 'Rejected' } }
  );

  auditLogService.record({
    targetType: 'Task', targetId: taskId, projectId,
    action: 'monitoring_task_rejected', fromValue: 'Pending', toValue: 'Rejected', userId
  });

  if (reason) {
    await recordMonitoringFeedbackIfAny(projectId, reason, userId);
  }

  return result;
}

async function recordMonitoringFeedbackIfAny(projectId, reason, userId) {
  try {
    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    await sharedMemory.remember({
      agencyId,
      projectId,
      title: 'Monitoring feedback from a rejected recovery task',
      description: 'An AI-proposed rank-drop recovery task was rejected on human review.',
      content: `A prior rank-drop recovery task for this project was rejected. Reason given: ${reason}`,
      type: 'do_not_do'
    });
  } catch (error) {
    logger.warn(TAG, `Failed to record monitoring-feedback memory for project ${projectId}: ${error.message}`, { projectId });
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'monitoringAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  retryDropAnalysis,
  collectRankDrops,
  analyzeDrop,
  approveTask,
  rejectTask,
  getExecutionHistory
};
