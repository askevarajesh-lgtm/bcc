const mongoose = require('mongoose');
const WorkspaceGeoAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      headings: [{ level: { type: Number }, text: { type: String } }],
      wordCount: { type: Number, default: 0 },
      hasExistingFaqSchema: { type: Boolean, default: false },
      indexable: { type: Boolean, default: null }
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  // --- Enterprise GEO Extensions ---
  versions: {
    analysisVersion: { type: String, default: '1.0' },
    promptVersion: { type: String, default: '1.0' },
    crawlerVersion: { type: String, default: '1.0' },
    engineVersion: { type: String, default: '1.0' }
  },
  
  overallGeoScore: { type: Number, min: 0, max: 100, default: null },
  healthLevel: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'poor' },
  scoreBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  progress: {
    stage: { type: String, enum: ['Queued', 'Crawling', 'Analyzing', 'AI Interpretation', 'Completed', 'Failed'], default: 'Queued' },
    percent: { type: Number, default: 0 }
  },
  
  performance: {
    totalRuntimeMs: { type: Number, default: 0 },
    pagesProcessed: { type: Number, default: 0 },
    pagesCached: { type: Number, default: 0 }
  },

  pageAnalysisIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoPageAnalysis' }],
  technicalAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoTechnicalAnalysis', default: null },
  entityAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoEntityAnalysis', default: null },
  // ---------------------------------
  agent: {
    agentKey: { type: String, default: null }, // 'geo-agent'; data reference only
    summary: { type: String, default: null },
    entityConsistencyScore: { type: Number, min: 0, max: 100, default: null }, // site-wide, not per-page
    recommendations: [{
      scope: { type: String, enum: ['sitewide', 'page'], default: 'sitewide' },
      pageUrl: { type: String, default: null }, // set only when scope === 'page'
      title: { type: String, required: true },
      description: { type: String, default: '' },
      missingElements: [{ type: String }], // e.g. "no Organization schema on homepage", "inconsistent brand name across titles"
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceGeoAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceGeoAudit', WorkspaceGeoAuditSchema, 'workspace_geo_audits');
