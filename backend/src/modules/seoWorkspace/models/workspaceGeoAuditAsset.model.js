const mongoose = require('mongoose');

const options = { discriminatorKey: 'assetType', collection: 'workspace_geo_audit_assets', timestamps: true };

const WorkspaceGeoAuditAssetSchema = new mongoose.Schema({}, options);

WorkspaceGeoAuditAssetSchema.index({ projectId: 1 });
WorkspaceGeoAuditAssetSchema.index({ auditId: 1 }, { sparse: true });

const WorkspaceGeoAuditAsset = mongoose.model('WorkspaceGeoAuditAsset', WorkspaceGeoAuditAssetSchema);

// 1. Geo Audit Model
const WorkspaceGeoAudit = WorkspaceGeoAuditAsset.discriminator('WorkspaceGeoAudit', new mongoose.Schema({
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

  pageAnalysisIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset' }],
  technicalAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset', default: null },
  entityAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset', default: null },
  // ---------------------------------
  agent: {
    agentKey: { type: String, default: null }, 
    summary: { type: String, default: null },
    entityConsistencyScore: { type: Number, min: 0, max: 100, default: null }, 
    recommendations: [{
      scope: { type: String, enum: ['sitewide', 'page'], default: 'sitewide' },
      pageUrl: { type: String, default: null }, 
      title: { type: String, required: true },
      description: { type: String, default: '' },
      missingElements: [{ type: String }], 
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}), 'audit');

WorkspaceGeoAuditAssetSchema.index({ projectId: 1, createdAt: -1 }, { sparse: true });


// 2. Geo Page Analysis Model
const WorkspaceGeoPageAnalysis = WorkspaceGeoAuditAsset.discriminator('WorkspaceGeoPageAnalysis', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  url: { type: String, required: true },
  contentHash: { type: String, required: true }, 

  schemaScore: { type: Number, min: 0, max: 100, default: null },
  contentScore: { type: Number, min: 0, max: 100, default: null },
  authorityScore: { type: Number, min: 0, max: 100, default: null },
  
  evidence: [{
    type: { type: String }, 
    severity: { type: String },
    message: { type: String },
    source: { type: String }
  }]
}), 'pageAnalysis');

WorkspaceGeoAuditAssetSchema.index({ assetType: 1, auditId: 1, url: 1 }, { partialFilterExpression: { assetType: 'pageAnalysis' } });


// 3. Geo Technical Analysis Model
const WorkspaceGeoTechnicalAnalysis = WorkspaceGeoAuditAsset.discriminator('WorkspaceGeoTechnicalAnalysis', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  overallTechnicalScore: { type: Number, min: 0, max: 100, default: null },
  
  metrics: {
    hasRobotsTxt: { type: Boolean, default: null },
    hasSitemapXml: { type: Boolean, default: null },
    brokenCanonicalCount: { type: Number, default: 0 },
    nonIndexableCount: { type: Number, default: 0 }
  },
  
  evidence: [{
    type: { type: String },
    severity: { type: String },
    page: { type: String },
    message: { type: String },
    source: { type: String }
  }]
}), 'technicalAnalysis');


// 4. Geo Entity Analysis Model
const WorkspaceGeoEntityAnalysis = WorkspaceGeoAuditAsset.discriminator('WorkspaceGeoEntityAnalysis', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAuditAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  overallEntityScore: { type: Number, min: 0, max: 100, default: null },
  knowledgeGraphScore: { type: Number, min: 0, max: 100, default: null },
  
  entities: [{
    name: { type: String },
    type: { type: String }, 
    occurrences: { type: Number },
    relatedPages: [{ type: String }]
  }],

  relationships: [{
    sourceEntity: { type: String },
    targetEntity: { type: String },
    relationType: { type: String }
  }],
  
  evidence: [{
    type: { type: String },
    severity: { type: String },
    page: { type: String },
    message: { type: String },
    source: { type: String }
  }]
}), 'entityAnalysis');


module.exports = {
  WorkspaceGeoAuditAsset,
  WorkspaceGeoAudit,
  WorkspaceGeoPageAnalysis,
  WorkspaceGeoTechnicalAnalysis,
  WorkspaceGeoEntityAnalysis
};
