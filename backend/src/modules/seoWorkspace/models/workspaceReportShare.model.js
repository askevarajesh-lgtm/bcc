const mongoose = require('mongoose');

const WorkspaceReportShareSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReport', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  shareToken: { type: String, required: true, unique: true },
  accessType: { type: String, enum: ['public', 'password-protected'], default: 'public' },
  passwordHash: { type: String }, // If password-protected
  
  expiresAt: { type: Date },
  isRevoked: { type: Boolean, default: false },
  
  views: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  
  accessLogs: [{
    ipAddress: { type: String },
    userAgent: { type: String },
    accessedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

WorkspaceReportShareSchema.index({ shareToken: 1 });
WorkspaceReportShareSchema.index({ reportId: 1 });

module.exports = mongoose.model('WorkspaceReportShare', WorkspaceReportShareSchema, 'workspace_report_shares');
