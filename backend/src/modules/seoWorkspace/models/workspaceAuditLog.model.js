const mongoose = require('mongoose');

// History/versioning: observes state transitions on Project/Strategy/Task/Report.
// Deliberately does not replace or duplicate those models — this collection only
// records what changed, when, and by whom.
const WorkspaceAuditLogSchema = new mongoose.Schema({
  targetType: {
    type: String,
    // Extended additively for the SEO Auditor, Keyword Research,
    // Competitor, Technical SEO, and Content agents' approval-gate logging
    // (audit findings, keyword suggestions, competitor suggestions,
    // technical findings, content briefs). Existing rows using earlier
    // values are unaffected.
    enum: ['Project', 'Strategy', 'Task', 'Report', 'Audit', 'Keyword', 'Competitor', 'TechnicalAudit', 'ContentBrief'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true // e.g. 'status_change', 'created', 'settings_updated'
  },
  fromValue: { type: mongoose.Schema.Types.Mixed, default: null },
  toValue: { type: mongoose.Schema.Types.Mixed, default: null },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: { createdAt: true, updatedAt: false } });

WorkspaceAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
WorkspaceAuditLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceAuditLog', WorkspaceAuditLogSchema, 'workspace_audit_logs');