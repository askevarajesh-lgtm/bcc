const mongoose = require('mongoose');

const AutomationExecutionNodeLogSchema = new mongoose.Schema({
  executionRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationExecutionRun', required: true, index: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflow', required: true },
  nodeId: { type: String, required: true }, // The ID of the node in the DAG

  nodeType: { type: String, required: true }, // 'Trigger', 'Action', 'Condition', etc.
  nodeName: { type: String, default: null },

  status: {
    type: String,
    enum: ['Started', 'Evaluated', 'Passed', 'Failed', 'Completed', 'Retrying', 'Timeout', 'Error', 'Skipped', 'Cancelled'],
    required: true
  },

  message: { type: String, default: null },
  
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  durationMs: { type: Number, default: null },

  inputPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  outputPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  errorDetails: { type: mongoose.Schema.Types.Mixed, default: null }

}, { timestamps: true });

AutomationExecutionNodeLogSchema.index({ executionRunId: 1, createdAt: 1 });

module.exports = mongoose.model('AutomationExecutionNodeLog', AutomationExecutionNodeLogSchema, 'automation_execution_node_logs');
