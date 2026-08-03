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
    
    // Category Scores
    technical: { type: Number, default: null },
    content: { type: Number, default: null },
    performance: { type: Number, default: null },
    security: { type: Number, default: null },
    accessibility: { type: Number, default: null },
    schema: { type: Number, default: null },
    images: { type: Number, default: null },
    internalLinking: { type: Number, default: null },
    indexability: { type: Number, default: null },
    overall: { type: Number, default: 0 },
    
    // Score Explanations
    scoreBreakdown: [mongoose.Schema.Types.Mixed]
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
      issueId: { type: String, required: true },
      category: { type: String, required: true },
      severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
      issue: { type: String, required: true },
      affectedUrl: { type: String, default: null },
      evidence: { type: mongoose.Schema.Types.Mixed, default: null },
      rootCause: { type: String, default: null },
      suggestedTechnicalFix: { type: String, default: null },
      expectedSeoImpact: { type: String, default: null },
      estimatedDifficulty: { type: String, default: null },
      aiExplanation: { type: String, default: null }, // Added by AI afterwards
      taskType: { type: String, enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Technical Fix'], default: 'Content Edit' }
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