/**
 * ContentAI — Approval Gate.
 *
 * Draft → In Review → Approved → Published, mirroring the exact gate-check
 * *shape* `seoWorkspace/services/publishGate.service.js#checkTaskGate`
 * already established: require the current status to be the expected
 * pre-state, throw a `Publish Gate Blocked:` prefixed error otherwise. New
 * function here (not an edit to that file) because `publishGate.service.js`
 * is hard-wired to `WorkspaceTask`/`WorkspaceStrategy` — a `ContentPiece`
 * isn't a WorkspaceProject artifact, so wiring it through that file would
 * mean adding an unrelated model dependency there instead of reusing the
 * *pattern* it establishes, which is what's actually being reused.
 *
 * Rejection reuses `aiCore/sharedMemory.service.js#remember` exactly as
 * `blogSeoAgent.service.js#recordRejectedFindingsIfAny` already does, so
 * future generations for this workspace avoid repeating a rejected approach.
 *
 * Note on audit trail: transitions are NOT written to
 * `seoWorkspace/models/workspaceAuditLog.model.js` — that model's
 * `targetType` enum is closed (doesn't include 'ContentPiece') and its
 * `projectId` field is `required: true, ref: 'WorkspaceProject'`, which a
 * ContentPiece is not. Forcing a fit there would repeat the exact
 * dangling-ref anti-pattern already flagged elsewhere in this codebase.
 * Instead, every transition is (a) inherent in the immutable
 * `ContentVersion` history and (b) logged via `logger.logExecution` with
 * `projectId` set to the ContentPiece id — the same substitution
 * `blogSeoAgent.service.js` already makes for non-WorkspaceProject targets.
 */
const ContentPiece = require('../models/contentPiece.model');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');

const TAG = 'ContentApprovalGate';

function assertStatus(piece, expected, action) {
  if (piece.status !== expected) {
    throw new Error(`Publish Gate Blocked: Cannot ${action}. ContentPiece must be '${expected}'. Current status is '${piece.status}'.`);
  }
}

async function submitForReview(workspaceId, contentPieceId, userId) {
  const piece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!piece) throw new Error('Content piece not found');
  if (!piece.currentVersionId) {
    throw new Error('Publish Gate Blocked: Cannot submit for review — content piece has no generated version yet.');
  }
  assertStatus(piece, 'Draft', 'submit for review');

  piece.status = 'In Review';
  piece.assignedReviewerId = piece.assignedReviewerId || null;
  await piece.save();

  logger.logExecution({ executionId: `contentGate:submit:${contentPieceId}:${Date.now()}`, source: 'contentApprovalGate', projectId: contentPieceId, status: 'succeeded', meta: { action: 'submit_for_review', userId } });
  return piece;
}

async function approve(workspaceId, contentPieceId, userId) {
  const piece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!piece) throw new Error('Content piece not found');
  assertStatus(piece, 'In Review', 'approve');

  piece.status = 'Approved';
  piece.rejectionReason = null;
  await piece.save();

  logger.logExecution({ executionId: `contentGate:approve:${contentPieceId}:${Date.now()}`, source: 'contentApprovalGate', projectId: contentPieceId, status: 'succeeded', meta: { action: 'approve', userId } });
  return piece;
}

async function reject(workspaceId, contentPieceId, userId, reason) {
  const piece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!piece) throw new Error('Content piece not found');
  assertStatus(piece, 'In Review', 'reject');

  piece.status = 'Rejected';
  piece.rejectionReason = reason || null;
  await piece.save();

  logger.logExecution({ executionId: `contentGate:reject:${contentPieceId}:${Date.now()}`, source: 'contentApprovalGate', projectId: contentPieceId, status: 'succeeded', meta: { action: 'reject', userId, reason } });

  try {
    await sharedMemory.remember({
      agencyId: userId,
      title: `Rejected content: ${piece.generatorType} (${piece._id})`,
      description: `A ${piece.generatorType} content piece was rejected in review.`,
      content: reason
        ? `Do not repeat this approach for ${piece.generatorType} content on this workspace. Reason given: ${reason}`
        : `Do not repeat this approach for ${piece.generatorType} content on this workspace.`,
      type: 'do_not_do'
    });
  } catch (error) {
    logger.warn(TAG, `Failed to record rejection memory for content piece ${contentPieceId}: ${error.message}`);
  }

  return piece;
}

/**
 * Draft → In Review after a rejection, so a regenerated piece re-enters the
 * workflow instead of being stuck 'Rejected' forever.
 */
async function resetToDraftAfterRejection(workspaceId, contentPieceId) {
  const piece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!piece) throw new Error('Content piece not found');
  if (piece.status !== 'Rejected') return piece;
  piece.status = 'Draft';
  piece.rejectionReason = null;
  await piece.save();
  return piece;
}

/**
 * The only transition that touches live content — invoked by
 * contentAI.controller.js, which then calls the relevant publishBridge/*.
 */
async function markPublished(workspaceId, contentPieceId) {
  const piece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!piece) throw new Error('Content piece not found');
  assertStatus(piece, 'Approved', 'publish');

  piece.status = 'Published';
  piece.publishedAt = new Date();
  await piece.save();

  logger.logExecution({ executionId: `contentGate:publish:${contentPieceId}:${Date.now()}`, source: 'contentApprovalGate', projectId: contentPieceId, status: 'succeeded', meta: { action: 'publish' } });
  return piece;
}

module.exports = { submitForReview, approve, reject, resetToDraftAfterRejection, markPublished, assertStatus };
