const mongoose = require('mongoose');

const WorkspaceAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  taskId: { type: String, required: false }, // DataForSEO task ID
  
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
  
  // High-level scores
  metrics: {
    onpageScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    pagesCrawled: { type: Number, default: 0 },
    pagesWithErrors: { type: Number, default: 0 },
    pagesWithWarnings: { type: Number, default: 0 },
    
    // AI Agent Extensions
    performance: { type: Number, default: 0 },
    crawlability: { type: Number, default: 0 },
    security: { type: Number, default: 0 },
    onPage: { type: Number, default: 0 },
    mobileUsability: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },

  // Breakdown of issues
  issues: {
    brokenLinks: { type: Number, default: 0 },
    duplicateContent: { type: Number, default: 0 },
    missingMeta: { type: Number, default: 0 },
    slowPages: { type: Number, default: 0 },
    canonicalIssues: { type: Number, default: 0 },
    sslIssues: { type: Number, default: 0 }
  },

  rawResponseUrl: { type: String, default: null }, // S3 link or similar if we cache the full JSON payload
  
  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // e.g. 'seo-auditor'; data reference only
    summary: { type: String, default: null },
    findings: [{
      category: { type: String, required: true }, // e.g. 'broken_links', 'missing_meta', 'slow_pages', 'canonical_issues', 'ssl_issues', 'thin_content'
      severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
      issue: { type: String, required: true },
      recommendation: { type: String, default: '' },
      aiExplanation: { type: String, default: null }, // Why is this an issue?
      generatedFix: { type: mongoose.Schema.Types.Mixed, default: null }, // Safe auto-fix code snippet
      htmlPreview: { type: String, default: null }, // Snippet of HTML where issue occurred
      taskType: { type: String, enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking'], default: 'Content Edit' },
      pageUrl: { type: String, default: null }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceAudit', WorkspaceAuditSchema, 'workspace_audits');