const mongoose = require('mongoose');

const WorkspaceReportExecutionSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReport', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },

  generationDurationMs: { type: Number },
  aiLatencyMs: { type: Number },
  exportDurationMs: { type: Number },
  queueWaitTimeMs: { type: Number },
  
  retryCount: { type: Number, default: 0 },
  
  logs: [{
    level: { type: String, enum: ['info', 'warn', 'error'] },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
  }],
  
  failureReason: { type: String }
}, { timestamps: true });

WorkspaceReportExecutionSchema.index({ reportId: 1 });

module.exports = mongoose.model('WorkspaceReportExecution', WorkspaceReportExecutionSchema, 'workspace_report_executions');
