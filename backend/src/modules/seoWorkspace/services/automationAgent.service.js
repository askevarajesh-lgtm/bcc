/**
 * Automation Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Formalizes what is today scattered, hardcoded logic in
 * `workspaceCron.service.js` (one `settings.autopilot` boolean, one
 * hardcoded `drop >= 2` threshold, one hardcoded scheduled-report
 * due-check) into an inspectable, per-project rule set — exactly the
 * `seo_automation` collection designed in `seo-mongodb-schema-plan.md`
 * §2.3 and called out as a genuinely new concept with no existing
 * equivalent. Implemented here as `WorkspaceAutomation` /
 * `workspace_automations` (see that model's header for the naming
 * rationale), consumed only through this service — `workspaceCron.service.js`
 * itself is NOT modified (same "known open item, next phase" treatment
 * already given by every other agent pass in this module; see
 * `aiCore/README.md`).
 *
 * Mirrors the same two-phase shape as the other agents in this module
 * (monitoringAgent / reportingAgent / seoAuditorAgent / ...):
 *   1. evaluateTrigger()  – objective, no-AI data collection: reads
 *      already-existing, already-populated fields (WorkspaceKeyword.ranking,
 *      WorkspaceProject.lastAuditSync, WorkspaceProject.stats.totalBacklinks)
 *      to decide whether a rule's configured trigger condition is
 *      currently true. Deliberately does NOT fabricate a value when the
 *      underlying data doesn't exist yet — it returns `{ available: false,
 *      reason }` and the rule is honestly skipped for that run, the same
 *      "no fabrication" stance `monitoringAgent.service.js` takes for its
 *      own DataForSEO dependency. `credential_health_check` is always
 *      skipped this way today because the WordPress/GSC/GA4 adapters
 *      `marketplace-seo-platform-architecture.md` §1 designed do not exist
 *      yet — this agent does not invent a pass/fail for a check it can't
 *      actually perform.
 *   2. decideAction()      – the actual "agent" step: an AI call with this
 *      agent's own prompt (alert-configuration + executive-summary skills)
 *      turns the triggered condition into a short, human-readable
 *      rationale (and, for create_task actions, a specific task
 *      description) before the configured action is executed.
 *
 * Human approval — two composed gates, not one:
 *   - Rule-level (this agent's own gate): a rule starts life at
 *     `approvalStatus: 'Pending Approval'` on `WorkspaceAutomation` and is
 *     never evaluated or acted on until a human sets it to 'Approved' —
 *     approving a rule is how a human authorizes the agent to act
 *     autonomously on that specific, scoped policy going forward, rather
 *     than approving each individual firing.
 *   - Artifact-level (reused, not duplicated): when the configured action
 *     is `create_task`, the resulting WorkspaceTask still starts at its own
 *     existing default status 'Pending' — exactly the same
 *     already-existing gate `monitoringAgent.service.js` reuses — so an
 *     approved automation *policy* still can't push a live content change
 *     without a second, per-instance human sign-off.
 *
 * Reuse decisions (same as every other agent in this module — nothing here
 * is new infra):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue, under a distinct key (`automation-agent:<projectId>`)
 *     so a run here never races a monitoring/reporting/audit run for the
 *     same project.
 *   - Shared memory: recalled before the AI decision step (prior automation
 *     feedback — e.g. "don't pause autopilot for a single-day backlink
 *     dip" — steers future rationales); written to when a rule is rejected
 *     with a reason, same pattern as every other agent's per-rejection
 *     memory write.
 *   - Reuses the existing 'automation-agent' agentLoader key (added
 *     alongside this file, in `aiCore/agentLoader.service.js`), with skills
 *     ['alert-configuration', 'executive-summary'] — both already exist on
 *     disk under `seoWorkspace/skills/`; no new skill content was invented
 *     for this pass.
 *   - The `send_report` action calls `reportingAgent.run()` directly
 *     (lazy-required to avoid a require cycle) instead of re-implementing
 *     report generation — the Automation Agent's job is deciding *whether*
 *     and *why* to fire, not re-authoring report generation.
 *   - The `send_notification` action reuses the existing
 *     `tasks/notification.model.js` (`Notification`) collection, with one
 *     additive enum value (`workspace_automation_triggered`) — exactly the
 *     extension `marketplace-seo-platform-architecture.md` §10 already
 *     called for ("approval-queue items actually surface to users... instead
 *     of only logging to console").
 *   - The `pause_autopilot` action flips the existing
 *     `WorkspaceProject.settings.autopilot` boolean that
 *     `workspaceCron.service.js` already reads — no new field.
 *   - Due-checking reuses `workspaceCron.service.js`'s own `FREQUENCY_MS`
 *     lookup (exported additively from that file) rather than redefining
 *     the daily/weekly/monthly -> ms mapping a second time.
 *   - No new collection beyond `WorkspaceAutomation` itself, which models a
 *     genuinely new concept (see that file's header) — everything this
 *     agent reads or writes otherwise (WorkspaceKeyword, WorkspaceProject,
 *     WorkspaceTask, WorkspaceReport, Notification, WorkspaceAuditLog,
 *     WorkspaceMemory via sharedMemory) already exists.
 *
 * Marketplace gating: `WorkspaceAutomation.marketplaceModuleRequired`
 * stores the requirement (default `'seo_autopilot'`) but is not yet
 * enforced here — `marketplaceGate.service.js` is explicitly a separate,
 * not-yet-built piece per `marketplace-seo-platform-architecture.md` §10 /
 * `aiCore/README.md`'s "Explicitly NOT done" list. Documented here as a
 * known, intentional gap rather than silently skipped.
 */
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
 * @param {string} operator - gt | gte | lt | lte | eq
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
 * Is this rule due for a re-check right now, given its `frequency` and
 * `lastTriggeredAt`? A rule that has never fired is always due. Reuses
 * `workspaceCron.service.js`'s own FREQUENCY_MS map (see header note).
 *
 * @param {Object} rule - a WorkspaceAutomation document
 */
function isDue(rule) {
  const intervalMs = FREQUENCY_MS[rule.frequency] || FREQUENCY_MS.daily;
  if (!rule.lastTriggeredAt) return true;
  return (Date.now() - new Date(rule.lastTriggeredAt).getTime()) >= intervalMs;
}

/**
 * Phase 1: objective trigger evaluation. No AI, no fabricated data — see
 * this file's header for the "no fabrication" stance.
 *
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
      // Due-ness alone (checked by isDue()) determines eligibility for this
      // rule type; there is no metric to compare.
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
      // Honest gap: the WordPress/GSC/GA4 adapters this check would call
      // don't exist yet (marketplace-seo-platform-architecture.md §1).
      // Skipped rather than faked — see this file's header.
      return { available: false, reason: 'Credential-health adapters are not implemented yet; skipped rather than fabricated.' };

    default:
      return { available: false, reason: `Unknown ruleType "${rule.ruleType}".` };
  }
}

/**
 * Phase 2: the actual "agent" step. Own prompt; turns a triggered
 * condition into a short rationale (and, for create_task, a specific task
 * description), grounded in the alert-configuration/executive-summary
 * skills and any relevant shared memory.
 *
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
 * Executes the rule's configured action. Every branch is additive reuse of
 * an existing model/service — see this file's header for the reuse
 * rationale of each branch.
 *
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
      // Lazy-required to avoid a require cycle (reportingAgent doesn't
      // require this file, but keeping the require local to the branch
      // that needs it matches the "no top-level cycle risk" convention
      // already used elsewhere for cross-agent calls in this module).
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
 * Full agent run: for every enabled, Approved rule on this project that is
 * currently due, evaluate its trigger, and if met, decide + execute.
 * Serialized per-project through Execution Queue (own key, distinct from
 * every other agent's key in this module). A single rule failing does not
 * abort the run for the others — recorded in `failures`, same pattern as
 * `monitoringAgent.service.js`'s per-keyword failure handling.
 *
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
 * Retry — distinct from aiCore's automatic transient-error retry inside
 * aiEngine.complete. Re-attempts evaluate + decide + execute for one
 * specific rule, ignoring its `frequency`/`lastTriggeredAt` due-check
 * (a manual retry is inherently "due" by request) but still re-validating
 * the trigger condition against fresh data before acting — same "re-verify,
 * don't blindly re-fire" stance as
 * `monitoringAgent.service.js`'s `retryDropAnalysis`. Still serialized
 * through the same per-project Execution Queue key as run().
 *
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
 * Creates a new automation rule, starting at `approvalStatus: 'Pending
 * Approval'` — it will not be evaluated by run()/retryRule() until a human
 * approves it. No route/controller consumes this (No UI, per this
 * module's other agents) — intended for programmatic callers (a seed
 * script, another service, or a future admin surface).
 *
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
 * Human Approval Gate — approve path. Only moves this rule from
 * 'Pending Approval' to 'Approved'; a rule in any other state is left
 * untouched and an error is thrown (mirrors the scoped-update pattern
 * `monitoringAgent.service.js` uses for its own approve/reject).
 *
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
 * Human Approval Gate — reject path. Rejected rules stay in the collection
 * (not deleted), disabled from ever running by staying out of the
 * 'Approved' status run()/retryRule() require. A given reason is recorded
 * to shared memory so future rule proposals/decisions for this
 * project/agency carry that feedback — same per-rejection memory write
 * every other agent in this module already does.
 *
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

/**
 * Shared Memory write-side: best-effort, never breaks rejection if it
 * fails — same contract as every other agent's equivalent helper.
 */
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
 * Own execution history, read-side. Same shape as every other agent's
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
  // exported for targeted testing / reuse, same as monitoringAgent's
  // exported evaluateDrop/collectRankDrops equivalents
  evaluateTrigger,
  decideAction,
  isDue
};
