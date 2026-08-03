const WorkspaceAuditLog = require('../models/workspaceAuditLog.model');

async function record({ targetType, targetId, projectId, action, fromValue = null, toValue = null, userId }) {
  try {
    await WorkspaceAuditLog.create({ targetType, targetId, projectId, action, fromValue, toValue, userId });
  } catch (error) {
    console.error('[WorkspaceAuditLog] Failed to record entry:', error.message);
  }
}

module.exports = { record };
