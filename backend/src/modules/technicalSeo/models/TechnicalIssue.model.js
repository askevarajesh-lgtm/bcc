/**
 * TechnicalIssue Model
 * Tracks granular technical SEO issues linked to a specific audit run.
 * Enables regression tracking over time.
 */

const mongoose = require('mongoose');

const TechnicalIssueSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechnicalAudit', required: true },

  // Categorization
  category: { type: String, required: true }, // e.g., 'core_web_vitals', 'indexability'
  type: { type: String, required: true }, // general type
  code: { type: String, required: true }, // specific code e.g., 'CWV_LCP_POOR'

  // Severity & Confidence
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], required: true },
  confidence: { type: Number, min: 0, max: 100, default: 100 },
  
  // Issue details
  issue: { type: String, required: true },
  affectedUrls: [{ type: String }],
  
  // AI & Fixes
  autoFixable: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  aiRecommendation: { type: String, default: null },

  // State Tracking
  status: { type: String, enum: ['Open', 'Ignored', 'Resolved', 'Verified'], default: 'Open' },
  regression: { type: Boolean, default: false },

  // Timestamps
  resolvedDate: { type: Date, default: null },
  verifiedDate: { type: Date, default: null },
  
}, { timestamps: true });

// Multi-tenant isolation indices
TechnicalIssueSchema.index({ workspaceId: 1, projectId: 1, auditId: 1 });
// Regression detection index
TechnicalIssueSchema.index({ projectId: 1, code: 1, status: 1 });

module.exports = mongoose.model('TechnicalIssue', TechnicalIssueSchema, 'technical_seo_issues');
