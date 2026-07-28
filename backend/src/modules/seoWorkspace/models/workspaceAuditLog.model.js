const mongoose = require('mongoose');

const WorkspaceAuditLogSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['Project', 'Strategy', 'Task', 'Report', 'Audit', 'Keyword', 'Competitor', 'TechnicalAudit', 'ContentBrief', 'SchemaMarkup', 'InternalLink', 'ImageSeo'],
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