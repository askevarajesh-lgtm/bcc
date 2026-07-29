/**
 * seoWorkspace — Task Verification
 *
 * Drives the "Verify" step of the Fix pipeline (Architecture Refinements v2
 * §3): Detect -> Generate Fix -> Preview -> Approve -> Apply -> Verify ->
 * Close. Generic across any `WorkspaceTask`, not just Technical SEO — this
 * is what lets Blog SEO/Store SEO/Website Builder SEO/GEO/AEO reuse the same
 * Verify step later without a new service per module, by registering their
 * own category in `aiCore/fixEngine/verification/verifierRegistry`.
 *
 * Does not import any agent-specific model beyond `WorkspaceTask` itself —
 * category-specific recheck logic lives in the owning agent services, which
 * register it into the shared verifier registry.
 */
const WorkspaceTask = require('../models/workspaceTask.model');
const auditLogService = require('./auditLog.service');
const { verificationEngine } = require('../../aiCore/fixEngine').verification;

// taskType -> category fallback, only used when proposedChanges doesn't
// already carry a `category` (e.g. Technical SEO findings do; Schema
// Injection doesn't, since schemaAgent.approveSchemaMarkup builds its own
// proposedChanges shape).
const CATEGORY_BY_TASK_TYPE = {
  'Schema Injection': 'structured_data'
};

/**
 * @param {Object} task - a WorkspaceTask document
 * @returns {string|null}
 */
function determineCategory(task) {
  if (task.proposedChanges && task.proposedChanges.category) return task.proposedChanges.category;
  return CATEGORY_BY_TASK_TYPE[task.taskType] || null;
}

/**
 * @param {Object} task - a WorkspaceTask document
 * @returns {string[]}
 */
function determineAffectedPages(task) {
  if (task.generatedFix && Array.isArray(task.generatedFix.affectedPages) && task.generatedFix.affectedPages.length) {
    return task.generatedFix.affectedPages;
  }
  return task.pageUrl ? [task.pageUrl] : [];
}

/**
 * Maps the Verification Engine's raw status onto WorkspaceTask.verification.status.
 * 'Inconclusive' becomes the task's 'Pending Verification' state rather than
 * being force-closed either way (§3 — "Close" requires an explicit 'Verified').
 */
function toTaskVerificationStatus(engineStatus) {
  if (engineStatus === 'Verified') return 'Verified';
  if (engineStatus === 'Failed') return 'Failed';
  return 'Pending Verification'; // engineStatus === 'Inconclusive'
}

/**
 * @param {string} taskId
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<Object>} the updated WorkspaceTask document
 */
async function verifyTask(taskId, projectId, userId) {
  const task = await WorkspaceTask.findOne({ _id: taskId, projectId });
  if (!task) throw new Error('Task not found');

  if (task.status !== 'Implemented') {
    throw new Error(`Verify is only meaningful after Apply. Task status is '${task.status}', expected 'Implemented'.`);
  }

  const category = determineCategory(task);
  const fromStatus = task.verification?.status || 'Not Verified';

  if (!category) {
    task.verification = {
      status: 'Pending Verification',
      method: null,
      checkedAt: new Date(),
      details: `No verifiable category for taskType "${task.taskType}" yet — nothing retries automatically; left open for manual review.`
    };
    await task.save();
    return task;
  }

  const affectedPages = determineAffectedPages(task);
  const { status, details } = await verificationEngine.verify(task.taskType, category, affectedPages);
  const newStatus = toTaskVerificationStatus(status);

  task.verification = {
    status: newStatus,
    method: category,
    checkedAt: new Date(),
    details
  };
  // Verification failing does not revert task.status from 'Implemented' —
  // it's a separate signal, not an undo (§3).
  await task.save();

  auditLogService.record({
    targetType: 'Task', targetId: task._id, projectId,
    action: 'task_verification_run', fromValue: fromStatus, toValue: newStatus, userId
  });

  if (newStatus === 'Failed') {
    try {
      const Notification = require('../../tasks/notification.model');
      await Notification.create({
        userId,
        type: 'workspace_task_verification_failed',
        title: `Verification failed: ${task.taskType} on ${task.pageUrl}`,
        message: details,
        metadata: { projectId, taskId: task._id, category }
      });
    } catch (error) {
      // Fire-and-forget, same contract as auditLog.service.js and Logger —
      // a notification failure must never block the verification result itself.
      console.error('[taskVerification] Failed to raise verification-failed notification:', error.message);
    }
  }

  return task;
}

module.exports = { verifyTask, determineCategory, determineAffectedPages };
