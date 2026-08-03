const mongoose = require('mongoose');

const AutomationWorkflowSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  name: { type: String, required: true },
  description: { type: String, default: null },
  category: { type: String, default: 'General' },
  triggerType: { type: String, default: 'event' },
  tags: [{ type: String }],

  activeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflowVersion', default: null },

  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived', 'Active', 'Paused'],
    default: 'Draft'
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AutomationWorkflowSchema.index({ projectId: 1, status: 1 });
AutomationWorkflowSchema.index({ agencyId: 1 });

module.exports = mongoose.model('AutomationWorkflow', AutomationWorkflowSchema, 'automation_workflows');
