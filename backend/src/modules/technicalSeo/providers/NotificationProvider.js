/**
 * NotificationProvider
 * Handles routing of audit lifecycle notifications (Email, Slack, In-App).
 */

class NotificationProvider {
  /**
   * Notify when an audit completes successfully.
   * @param {Object} audit - The completed audit document.
   * @param {Object} context - { workspaceId, projectId }
   */
  static async notifyAuditComplete(audit, context) {
    console.log(`[NotificationProvider] Audit ${audit._id} completed for Project ${context.projectId}`);
    // Future: integration with agency workspace notification preferences
  }

  /**
   * Notify when a critical issue or regression is detected.
   * @param {Object} issue - The technical issue detected.
   * @param {Object} context - { workspaceId, projectId }
   */
  static async notifyCriticalIssue(issue, context) {
    console.log(`[NotificationProvider] CRITICAL: Issue ${issue.category} detected for Project ${context.projectId}`);
  }

  /**
   * Notify when an audit fails.
   * @param {Object} audit - The failed audit document.
   * @param {Error} error - The error that caused the failure.
   * @param {Object} context - { workspaceId, projectId }
   */
  static async notifyAuditFailed(audit, error, context) {
    console.error(`[NotificationProvider] AUDIT FAILED: ${audit._id} for Project ${context.projectId}. Reason: ${error.message}`);
  }
}

module.exports = NotificationProvider;
