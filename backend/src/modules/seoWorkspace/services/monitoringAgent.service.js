/**
 * Monitoring Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Mirrors the same two-phase shape as the other three agents in this
 * module (seoAuditorAgent / keywordResearchAgent / competitorAgent /
 * reportingAgent):
 *   1. collectRankDrops()  – objective data collection: fetches current
 *      SERP position for each Approved, tracked WorkspaceKeyword via
 *      DataForSEO (reuses dataForSeoService.getSerpResults — the exact
 *      same method workspaceCron.service.js's autopilot loop already
 *      calls), updates the keyword's ranking fields, and flags any
 *      keyword whose rank worsened by DROP_THRESHOLD or more.
 *   2. analyzeDrop()       – the actual "agent" step: an AI call with this
 *      agent's own prompt (rank-tracking + alert-configuration skills)
 *      diagnoses the drop and proposes one concrete recovery action.
 *      Persisted as a WorkspaceTask at its existing default status
 *      'Pending' — the human-approval gate here is the WorkspaceTask
 *      model's own pre-existing status field, reused as-is, not
 *      duplicated with a second gate.
 *
 * Relationship to the existing cron autopilot loop:
 *   workspaceCron.service.js's hourly job already does inline rank-drop
 *   detection and calls workspaceAgentOrchestrator.service.js's
 *   `seoMonitorAgent(project, keyword, dropAmount)` directly, with no
 *   retry/logging/execution-history and no gate distinction (task is
 *   created the same way regardless of source). Critically, when
 *   DataForSEO isn't configured, that loop FABRICATES a rank drop via
 *   `Math.random()` and presents it as if it were measured — the same
 *   fabrication issue already flagged for the orchestrator's inline
 *   keyword-fetch step (see keywordResearchAgent.service.js's header) and
 *   its own seoReporterAgent (see reportingAgent.service.js's header).
 *   That loop is NOT modified here — same "known open item" treatment.
 *   This agent's own collectRankDrops() deliberately does NOT fabricate:
 *   if DataForSEO isn't configured, monitoring for that project is
 *   honestly skipped (logged, not guessed) rather than inventing a drop.
 *   This agent is additive — a distinct, gated, honest code path a caller
 *   opts into via monitoringAgent.run() instead of the cron/orchestrator
 *   path. Both currently create rows in the same WorkspaceTask
 *   collection; nothing about the older path is broken or removed.
 *
 * Reuse decisions (same as the other three agents):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - The raw DataForSEO SERP call is wrapped with aiCore's retry.service
 *     directly, exactly like competitorAgent.service.js does for its own
 *     DataForSEO calls.
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue, under a distinct key so a monitoring-agent run never
 *     blocks (or is blocked by) an auditor/keyword/competitor/reporting
 *     run for the same project.
 *   - Shared memory: recalled before analysis (prior monitoring feedback —
 *     e.g. "don't recommend a full rewrite for small drops on this page")
 *     so future diagnoses carry that context; written to when a task this
 *     agent created is rejected with a reason.
 *   - Reuses the existing 'seo-monitor' agentLoader key (already defined
 *     with skills ['rank-tracking', 'alert-configuration']) instead of
 *     registering a new agent key — those two skill files did not exist
 *     yet on disk (same missing-skill situation fixed for 'seo-reporter'
 *     in the Reporting Agent pass), so they were added under
 *     seoWorkspace/skills/, not invented as new agent config.
 *   - No new collection: WorkspaceTask already exists for exactly this
 *     purpose, and its `status` field is already a Pending/Approved/
 *     Rejected/Implemented/Failed human-approval gate consumed by
 *     publishGate.service.js and the controller's updateTaskStatus. This
 *     agent's approveTask/rejectTask only move Pending -> Approved/
 *     Rejected and are scoped to `agent.agentKey` = this agent's key, so
 *     they never touch tasks created by the older orchestrator path or by
 *     a human — and they deliberately do NOT invoke the WordPress-publish
 *     side effect that already lives solely in the controller's
 *     updateTaskStatus, to avoid duplicating that logic a second time.
 *   - source/agent{} fields added to workspaceTask.model.js are additive;
 *     see that file's header comment — every pre-existing task defaults
 *     to source 'manual' and is completely unaffected.
 */
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

// Same threshold the existing cron autopilot loop uses (drop >= 2
// positions triggers a recovery task) — reused for consistency, not
// re-derived arbitrarily.
const DROP_THRESHOLD = 2;
const MAX_ALERTS_PER_RUN = 10; // cap AI calls per run, same rationale as competitorAgent's enrichment cap
const NOT_FOUND_RANK = 100; // same "not found in top 100" convention the cron loop already uses
const VALID_TASK_TYPES = ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization'];

/**
 * Phase 1: objective rank-drop detection. Fetches current SERP position
 * for each Approved, tracked keyword via DataForSEO (reused method, single
 * batched call — same shape as workspaceCron.service.js's existing call),
 * updates each keyword's ranking fields, and returns only the keywords
 * whose rank worsened by DROP_THRESHOLD or more.
 *
 * Deliberately does NOT fabricate a drop when DataForSEO isn't configured
 * — monitoring for the project is honestly skipped instead (see this
 * file's header note).
 *
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
 * Phase 2: the actual agent step. Own prompt; diagnoses one rank drop and
 * proposes a single concrete recovery action, grounded in the
 * rank-tracking/alert-configuration skills.
 *
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
 * Full agent run: collect rank drops + analyze each + persist a
 * WorkspaceTask per drop (default status 'Pending', the existing gate),
 * serialized per-project through Execution Queue (own key, distinct from
 * the other agents' keys). Logs a run-level execution entry (source:
 * 'monitoringAgent') alongside aiEngine's own per-AI-call entries.
 *
 * A single drop's analysis failing does not abort the whole run — it's
 * recorded in the returned `failures` array and logged individually, so
 * one bad AI response doesn't suppress alerts for every other dropped
 * keyword in the same project.
 *
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
 * Retry — distinct from aiCore's automatic transient-error retry inside
 * aiEngine.complete. Re-attempts analysis + task creation for one specific
 * keyword whose drop is already reflected in its stored ranking fields
 * (does not re-hit DataForSEO) — useful when a run's per-item analysis
 * failed (see `failures` above) and an operator wants to retry just that
 * one item rather than a full re-run. Still serialized through the same
 * per-project Execution Queue key as run().
 *
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
 * Human Approval Gate — approve path. Only moves this agent's own
 * 'Pending' tasks to 'Approved' (scoped by agent.agentKey so it never
 * touches tasks from the older orchestrator path or manual entries).
 * Deliberately does not invoke the WordPress-publish side effect that
 * already lives in the controller's updateTaskStatus — see this file's
 * header note on why that isn't duplicated here.
 *
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
 * Human Approval Gate — reject path. Rejected tasks stay in the collection
 * (not deleted). A given reason is recorded to shared memory so future
 * diagnoses for this project/agency carry that feedback — one rejection is
 * already a clear, specific signal (same reasoning as the other three
 * agents' per-rejection memory write).
 *
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

/**
 * Shared Memory write-side: best-effort, never breaks rejection if it fails.
 */
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
 * Own execution history, read-side. Same shape as the other agents'
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
