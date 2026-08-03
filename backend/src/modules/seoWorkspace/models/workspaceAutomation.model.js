const mongoose = require('mongoose');
const WorkspaceAutomationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  name: { type: String, required: true },

  ruleType: {
    type: String,
    enum: ['rank_drop_alert', 'scheduled_report', 'content_freshness', 'backlink_loss', 'credential_health_check', 'workflow'],
    required: true
  },

  trigger: {
    metric: { type: String, default: null },
    operator: { type: String, enum: ['gt', 'gte', 'lt', 'lte', 'eq', null], default: null },
    value: { type: Number, default: null }
  },

  action: {
    type: {
      type: String,
      enum: ['create_task', 'send_report', 'send_notification', 'pause_autopilot', 'execute_workflow'],
      required: true
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom', 'event_driven'], default: 'daily' },

  marketplaceModuleRequired: { type: String, default: 'seo_autopilot' },

  isEnabled: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date, default: null },

  approvalStatus: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Paused', 'Archived', 'Rejected'],
    default: 'Pending Approval'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  // New Enterprise Workflow Fields
  activeVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflowVersion', default: null },
  summary: { type: String, default: null },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflow', default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

WorkspaceAutomationSchema.index({ projectId: 1, isEnabled: 1 });
WorkspaceAutomationSchema.index({ agencyId: 1 });

module.exports = mongoose.model('WorkspaceAutomation', WorkspaceAutomationSchema, 'workspace_automations');
