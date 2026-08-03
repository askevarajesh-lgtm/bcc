const mongoose = require('mongoose');

const WorkspaceAeoAuditPageSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAudit', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  pageUrl: { type: String, required: true },
  
  status: { type: String, enum: ['pending', 'queued', 'running', 'completed', 'failed'], default: 'pending' },
  error: { type: String, default: null },

  pageScores: {
    readinessScore: { type: Number, min: 0, max: 100, default: null },
    contentQuality: { type: Number, min: 0, max: 100, default: null },
    readability: { type: Number, min: 0, max: 100, default: null }
  },

  schemaValidation: {
    // Stores programmatic validation results
    valid: { type: Boolean, default: null },
    issues: [{
      type: { type: String }, // e.g., 'FAQ', 'Article'
      severity: { type: String, enum: ['error', 'warning', 'info'] },
      message: { type: String }
    }]
  },

  completedAt: { type: Date, default: null }
}, { timestamps: true });

WorkspaceAeoAuditPageSchema.index({ auditId: 1, pageUrl: 1 }, { unique: true });
WorkspaceAeoAuditPageSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('WorkspaceAeoAuditPage', WorkspaceAeoAuditPageSchema, 'workspace_aeo_audit_pages');
