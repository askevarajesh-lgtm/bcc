const mongoose = require('mongoose');

const AutomationExecutionRunSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflow', required: true, index: true },
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflowVersion', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },

  status: {
    type: String,
    enum: ['Pending', 'Running', 'Succeeded', 'Failed', 'Retrying', 'Cancelled'],
    default: 'Pending',
    index: true
  },

  triggerContext: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  durationMs: { type: Number, default: null },

  retryCount: { type: Number, default: 0 },
  error: { type: mongoose.Schema.Types.Mixed, default: null },
  result: { type: mongoose.Schema.Types.Mixed, default: null },

  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // null implies system/event driven
}, { timestamps: true });

AutomationExecutionRunSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AutomationExecutionRun', AutomationExecutionRunSchema, 'automation_execution_runs');
