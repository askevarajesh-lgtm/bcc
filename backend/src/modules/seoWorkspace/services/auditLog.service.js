const WorkspaceAuditLog = require('../models/workspaceAuditLog.model');

/**
 * Records a single state-transition entry. Fire-and-forget by design (a logging
 * failure should never block the actual workflow action) — errors are caught
 * and logged, not thrown.
 */
async function record({ targetType, targetId, projectId, action, fromValue = null, toValue = null, userId }) {
  try {
    await WorkspaceAuditLog.create({ targetType, targetId, projectId, action, fromValue, toValue, userId });
  } catch (error) {
    console.error('[WorkspaceAuditLog] Failed to record entry:', error.message);
  }
}

module.exports = { record };
