const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const WorkspaceAutomation = require('../models/workspaceAutomation.model');
const auditLogService = require('./auditLog.service');
const { FREQUENCY_MS } = require('./workspaceCron.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'automation-agent';
const TAG = 'AutomationAgent';

const VALID_TASK_TYPES = ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization'];
const MAX_RULES_PER_RUN = 20; // cap AI calls per run, same rationale as monitoringAgent's MAX_ALERTS_PER_RUN

/**
 * @param {number} current
 * @param {string} operator 
 * @param {number} target
 */
function compareOperator(current, operator, target) {
  if (current == null || target == null) return false;
  switch (operator) {
    case 'gt': return current > target;
    case 'gte': return current >= target;
    case 'lt': return current < target;
    case 'lte': return current <= target;
    case 'eq': return current === target;
    default: return false;
  }
}

/**
 * @param {Object} rule - a WorkspaceAutomation document
 */
function isDue(rule) {
  const intervalMs = FREQUENCY_MS[rule.frequency] || FREQUENCY_MS.daily;
  if (!rule.lastTriggeredAt) return true;
  return (Date.now() - new Date(rule.lastTriggeredAt).getTime()) >= intervalMs;
}

/**
 * @param {Object} rule - a WorkspaceAutomation document
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ available: boolean, reason?: string, currentValue?: number|null, context?: Object }>}
 */
async function evaluateTrigger(rule, project) {
  switch (rule.ruleType) {
    case 'rank_drop_alert': {
      const keywords = await WorkspaceKeyword.find({ projectId: project._id, isDeleted: false, status: 'Approved' }).lean();
      if (!keywords.length) return { available: false, reason: 'No approved keywords tracked yet for this project.' };

      let worst = null;
      for (const kw of keywords) {
        const prev = kw.ranking?.previousRank;
        const curr = kw.ranking?.currentRank;
        if (prev == null || curr == null) continue;
        const drop = curr - prev;
        if (!worst || drop > worst.drop) worst = { keyword: kw, drop };
      }
      if (!worst) return { available: false, reason: 'No ranking history recorded yet for tracked keywords.' };

      return { available: true, currentValue: worst.drop, context: { keyword: worst.keyword } };
    }

    case 'scheduled_report':
      return { available: true, currentValue: null, context: {} };

    case 'content_freshness': {
      if (!project.lastAuditSync) return { available: false, reason: 'No audit has run for this project yet.' };
      const daysSince = Math.floor((Date.now() - new Date(project.lastAuditSync).getTime()) / (24 * 60 * 60 * 1000));
      return { available: true, currentValue: daysSince, context: {} };
    }

    case 'backlink_loss': {
      const total = project.stats?.totalBacklinks;
      if (total == null) return { available: false, reason: 'No backlink data recorded for this project yet.' };
      return { available: true, currentValue: total, context: {} };
    }

    case 'credential_health_check':
      return { available: false, reason: 'Credential-health adapters are not implemented yet; skipped rather than fabricated.' };

    default:
      return { available: false, reason: `Unknown ruleType "${rule.ruleType}".` };
  }
}

/**
 * @param {Object} rule
 * @param {Object} project
 * @param {Object} evaluation - result of evaluateTrigger()
 * @param {string} workspaceId
 */
async function decideAction(rule, project, evaluation, workspaceId) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const prompt = `You are the Automation Agent for ${project.name} (${project.domain}).

An automation rule named "${rule.name}" (type: ${rule.ruleType}) has met its trigger condition and is about to fire.
Trigger: ${rule.trigger?.metric || 'n/a'} ${rule.trigger?.operator || ''} ${rule.trigger?.value ?? ''}
Observed value: ${evaluation.currentValue ?? 'n/a'}
Configured action: ${rule.action?.type}
${skillsBlock}
${memoryBlock}

Write a short (1-3 sentence) explanation, for a non-technical reviewer, of why this rule fired and what the configured action will do about it. If the configured action is "create_task", also propose one specific, actionable task description.

Respond with a JSON object of this exact shape:
{
  "rationale": "short explanation grounded in the data given",
  "taskDescription": "only relevant if action is create_task; a specific, actionable one-sentence description, otherwise null",
  "urgency": "low" | "medium" | "high"
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.4,
    maxTokens: 400,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI decision JSON: ${error.message}`, { projectId: project._id, ruleId: rule._id });
    throw new Error('Automation Agent: AI response was not valid JSON, action decision failed.');
  }

  return {
    rationale: parsed.rationale || `Automation rule "${rule.name}" triggered.`,
    taskDescription: parsed.taskDescription || null,
    urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium'
  };
}

/**
 * @param {Object} rule
 * @param {Object} project
 * @param {Object} decision - result of decideAction()
 * @param {Object} evaluation - result of evaluateTrigger()
 * @param {string} workspaceId
 */
async function executeAction(rule, project, decision, evaluation, workspaceId) {
  switch (rule.action?.type) {
    case 'create_task': {
      const task = await WorkspaceTask.create({
        projectId: project._id,
        pageUrl: rule.action.config?.pageUrl || evaluation.context?.keyword?.ranking?.url || '/',
        taskType: VALID_TASK_TYPES.includes(rule.action.config?.taskType) ? rule.action.config.taskType : 'Content Edit',
        description: decision.taskDescription || decision.rationale,
        proposedChanges: (rule.action.config?.proposedChanges && typeof rule.action.config.proposedChanges === 'object')
          ? rule.action.config.proposedChanges
          : { action: 'Review flagged by automation rule', urgency: decision.urgency },
        source: 'automation-agent',
        agent: {
          agentKey: AGENT_KEY,
          sourceKeywordId: evaluation.context?.keyword?._id || null,
          dropAmount: evaluation.currentValue ?? null,
          rationale: decision.rationale
        }
      });
      return { type: 'create_task', taskId: task._id };
    }

    case 'send_report': {
      const reportingAgent = require('./reportingAgent.service');
      const report = await reportingAgent.run(project._id, { reportType: rule.action.config?.reportType || 'comprehensive' }, workspaceId);
      return { type: 'send_report', reportId: report._id };
    }

    case 'send_notification': {
      const Notification = require('../../tasks/notification.model');
      const notification = await Notification.create({
        userId: project.createdBy || project.companyId,
        type: 'workspace_automation_triggered',
        title: `Automation rule triggered: ${rule.name}`,
        message: decision.rationale,
        metadata: { projectId: project._id, ruleId: rule._id, ruleType: rule.ruleType, urgency: decision.urgency }
      });
      return { type: 'send_notification', notificationId: notification._id };
    }

    case 'pause_autopilot': {
      await WorkspaceProject.findByIdAndUpdate(project._id, { 'settings.autopilot': false });
      auditLogService.record({
        targetType: 'Project', targetId: project._id, projectId: project._id,
        action: 'automation_paused_autopilot', fromValue: true, toValue: false, userId: rule.createdBy
      });
      return { type: 'pause_autopilot', autopilot: false };
    }

    default:
      throw new Error(`Automation Agent: unknown action type "${rule.action?.type}".`);
  }
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<{ triggered: Array, skipped: Array, failures: Array }>}
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`automation-agent:${projectId}`, async () => {
    const executionId = `automationAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const rules = await WorkspaceAutomation.find({ projectId, isEnabled: true, approvalStatus: 'Approved' });
      const candidates = rules.slice(0, MAX_RULES_PER_RUN);

      const triggered = [];
      const skipped = [];
      const failures = [];

      for (const rule of candidates) {
        try {
          if (!isDue(rule)) {
            skipped.push({ ruleId: rule._id, reason: 'not due yet' });
            continue;
          }

          const evaluation = await evaluateTrigger(rule, project);
          if (!evaluation.available) {
            skipped.push({ ruleId: rule._id, reason: evaluation.reason });
            continue;
          }

          const conditionMet = rule.ruleType === 'scheduled_report'
            ? true
            : compareOperator(evaluation.currentValue, rule.trigger?.operator, rule.trigger?.value);

          if (!conditionMet) {
            skipped.push({ ruleId: rule._id, reason: 'trigger condition not met', currentValue: evaluation.currentValue });
            continue;
          }

          const decision = await decideAction(rule, project, evaluation, agencyId);
          const outcome = await executeAction(rule, project, decision, evaluation, agencyId);

          rule.lastTriggeredAt = new Date();
          await rule.save();

          auditLogService.record({
            targetType: 'Automation', targetId: rule._id, projectId,
            action: 'rule_triggered', fromValue: null, toValue: outcome.type, userId: rule.createdBy
          });

          triggered.push({ ruleId: rule._id, ruleType: rule.ruleType, outcome, rationale: decision.rationale });
        } catch (error) {
          logger.logExecution({
            executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId,
            status: 'failed', error: error.message, meta: { ruleId: rule._id }
          });
          failures.push({ ruleId: rule._id, error: error.message });
        }
      }

      logger.logExecution({
        executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { ruleCount: rules.length, triggeredCount: triggered.length, skippedCount: skipped.length, failureCount: failures.length }
      });

      return { triggered, skipped, failures };
    } catch (error) {
      logger.logExecution({
        executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} projectId
 * @param {string} ruleId
 * @param {string} [workspaceId]
 */
async function retryRule(projectId, ruleId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const rule = await WorkspaceAutomation.findOne({ _id: ruleId, projectId });
  if (!rule) throw new Error('Automation rule not found for this project.');
  if (rule.approvalStatus !== 'Approved') {
    throw new Error(`Automation Agent: rule must be 'Approved' before it can run (current status: '${rule.approvalStatus}').`);
  }
  if (!rule.isEnabled) {
    throw new Error('Automation Agent: rule is currently disabled.');
  }

  const agencyId = workspaceId || rule.agencyId || project.createdBy || project.companyId;

  return executionQueue.run(`automation-agent:${projectId}`, async () => {
    const executionId = `automationAgent:retry:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId, status: 'started', meta: { retry: true, ruleId } });

    try {
      const evaluation = await evaluateTrigger(rule, project);
      if (!evaluation.available) {
        throw new Error(`Automation Agent: trigger data unavailable (${evaluation.reason})`);
      }

      const conditionMet = rule.ruleType === 'scheduled_report'
        ? true
        : compareOperator(evaluation.currentValue, rule.trigger?.operator, rule.trigger?.value);

      if (!conditionMet) {
        throw new Error(`Automation Agent: trigger condition no longer met (current value ${evaluation.currentValue}); nothing to retry.`);
      }

      const decision = await decideAction(rule, project, evaluation, agencyId);
      const outcome = await executeAction(rule, project, decision, evaluation, agencyId);

      rule.lastTriggeredAt = new Date();
      await rule.save();

      auditLogService.record({
        targetType: 'Automation', targetId: rule._id, projectId,
        action: 'rule_triggered_retry', fromValue: null, toValue: outcome.type, userId: rule.createdBy
      });

      logger.logExecution({
        executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt, meta: { retry: true, ruleId, outcome }
      });

      return { ruleId: rule._id, outcome, rationale: decision.rationale };
    } catch (error) {
      logger.logExecution({
        executionId, source: 'automationAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message, meta: { retry: true, ruleId }
      });
      throw error;
    }
  });
}

/**
 * @param {string} projectId
 * @param {Object} payload - { name, ruleType, trigger, action, frequency, marketplaceModuleRequired }
 * @param {string} userId
 */
async function createRule(projectId, payload, userId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const rule = await WorkspaceAutomation.create({
    projectId,
    agencyId: project.createdBy || project.companyId,
    name: payload.name,
    ruleType: payload.ruleType,
    trigger: payload.trigger || {},
    action: payload.action,
    frequency: payload.frequency || 'daily',
    marketplaceModuleRequired: payload.marketplaceModuleRequired || 'seo_autopilot',
    createdBy: userId
  });

  auditLogService.record({
    targetType: 'Automation', targetId: rule._id, projectId,
    action: 'automation_rule_created', fromValue: null, toValue: 'Pending Approval', userId
  });

  return rule.toObject();
}

/**
 * @param {string} ruleId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveRule(ruleId, projectId, userId) {
  const result = await WorkspaceAutomation.findOneAndUpdate(
    { _id: ruleId, projectId, approvalStatus: 'Pending Approval' },
    { $set: { approvalStatus: 'Approved', approvedBy: userId, approvedAt: new Date(), rejectionReason: null } },
    { new: true }
  );
  if (!result) throw new Error('Automation rule not found or not in Pending Approval status.');

  auditLogService.record({
    targetType: 'Automation', targetId: ruleId, projectId,
    action: 'automation_rule_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return result.toObject();
}

/**
 * @param {string} ruleId
 * @param {string} projectId
 * @param {string} userId
 * @param {string} [reason]
 */
async function rejectRule(ruleId, projectId, userId, reason) {
  const result = await WorkspaceAutomation.findOneAndUpdate(
    { _id: ruleId, projectId, approvalStatus: 'Pending Approval' },
    { $set: { approvalStatus: 'Rejected', rejectionReason: reason || null } },
    { new: true }
  );
  if (!result) throw new Error('Automation rule not found or not in Pending Approval status.');

  auditLogService.record({
    targetType: 'Automation', targetId: ruleId, projectId,
    action: 'automation_rule_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  if (reason) {
    await recordRuleFeedbackIfAny(projectId, result, reason);
  }

  return result.toObject();
}

async function recordRuleFeedbackIfAny(projectId, rule, reason) {
  try {
    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || rule.agencyId;

    await sharedMemory.remember({
      agencyId,
      projectId,
      title: 'Automation rule rejected on human review',
      description: `A proposed automation rule ("${rule.name}", ${rule.ruleType}) was rejected.`,
      content: `Reason given: ${reason}`,
      type: 'do_not_do'
    });
  } catch (error) {
    logger.warn(TAG, `Failed to record automation-rejection memory for rule ${rule._id}: ${error.message}`, { projectId });
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'automationAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  retryRule,
  createRule,
  approveRule,
  rejectRule,
  getExecutionHistory,
  evaluateTrigger,
  decideAction,
  isDue
};
