const mongoose = require('mongoose');

const AutomationWorkflowVersionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflow', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },

  versionNumber: { type: Number, required: true },
  
  // React Flow graph / DAG representation
  nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  edges: { type: [mongoose.Schema.Types.Mixed], default: [] },

  // Extracted configurations for backend execution
  triggerConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  actionConfigs: { type: mongoose.Schema.Types.Mixed, default: {} },
  variables: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Execution defaults
  retryConfig: {
    maxRetries: { type: Number, default: 3 },
    retryDelayMs: { type: Number, default: 5000 },
    exponentialBackoff: { type: Boolean, default: true }
  },
  timeoutMs: { type: Number, default: 300000 }, // 5 mins

  validationState: {
    isValid: { type: Boolean, default: false },
    errors: { type: [String], default: [] }
  },

  commitMessage: { type: String, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AutomationWorkflowVersionSchema.index({ workflowId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('AutomationWorkflowVersion', AutomationWorkflowVersionSchema, 'automation_workflow_versions');
