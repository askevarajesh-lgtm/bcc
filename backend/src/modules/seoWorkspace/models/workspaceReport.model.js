const mongoose = require('mongoose');

const WorkspaceReportSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null }, // Optional, could be an overarching agency report
  
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive', 'executive_summary'], required: true },
  
  content: { type: String }, // For AI generated Markdown reports
  
  format: { type: String, enum: ['pdf', 'excel', 'csv', 'markdown'], default: 'pdf' },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  
  downloadUrl: { type: String, default: null },
  
  isScheduled: { type: Boolean, default: false },
  scheduleFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  emailRecipients: [{ type: String }],
  // Additive: when this report doc is a recurring schedule definition
  // (isScheduled: true), lastRunAt tracks when the scheduler last produced
  // a fresh report instance from it, so due-ness can be computed against
  // scheduleFrequency instead of the fields being declared-but-inert.
  lastRunAt: { type: Date, default: null },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

WorkspaceReportSchema.index({ agencyId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceReport', WorkspaceReportSchema, 'workspace_reports');