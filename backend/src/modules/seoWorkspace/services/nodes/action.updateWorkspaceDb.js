const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceAuditLog = require('../../models/workspaceAuditLog.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionUpdateWorkspaceDb';

module.exports = {
  id: 'update_workspace_db',

  metadata() {
    return {
      id: 'update_workspace_db',
      name: 'Update Workspace Database',
      category: 'integrations',
      description: 'Updates project metadata, saves audit reports, or writes audit records to the workspace database.'
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config, context) {
    const projectId = context.projectId;
    const subject = config.subject || config.note || 'Site Audit Workflow Execution';
    const payload = config.payload || config.value || config.reportUrl || '';
    const field = config.field || config.targetField || 'lastAuditReport';

    logger.info(TAG, `Executing Update Workspace DB for project ${projectId}: [${field}] -> ${subject}`);

    try {
      if (projectId) {
        await WorkspaceProject.findByIdAndUpdate(projectId, {
          $set: {
            'metadata.lastAuditRunAt': new Date(),
            'metadata.lastAuditReportUrl': payload || undefined,
            'metadata.lastAuditSubject': subject
          }
        });

        // Write to audit log
        await WorkspaceAuditLog.create({
          projectId,
          userId: context.userId || null,
          action: 'AUTOMATION_RUN_UPDATE',
          details: {
            subject,
            field,
            payload,
            runId: context.runId
          }
        }).catch(() => {});
      }
    } catch (err) {
      logger.warn(TAG, `Update Workspace DB note: ${err.message}`);
    }

    return {
      success: true,
      updated: true,
      subject,
      payload,
      field,
      updatedAt: new Date().toISOString()
    };
  }
};
