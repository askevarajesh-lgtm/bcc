const mongoose = require('mongoose');

const WorkspaceReportSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null }, 
  
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive', 'executive_summary'], required: true },
  
  content: { type: String }, 
  
  format: { type: String, enum: ['pdf', 'excel', 'csv', 'markdown'], default: 'pdf' },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  
  downloadUrl: { type: String, default: null },
  
  isScheduled: { type: Boolean, default: false },
  scheduleFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  emailRecipients: [{ type: String }],
  lastRunAt: { type: Date, default: null },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  source: { type: String, enum: ['manual', 'reporting-agent'], default: 'manual' },
  agent: {
    agentKey: { type: String, default: null }, 
    dataSources: [{ type: String }], 
    summary: { type: String, default: null },
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }
  }
}, { timestamps: true });

WorkspaceReportSchema.index({ agencyId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceReport', WorkspaceReportSchema, 'workspace_reports');