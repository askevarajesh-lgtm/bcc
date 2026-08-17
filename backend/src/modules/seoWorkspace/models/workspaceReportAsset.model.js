const mongoose = require('mongoose');

const options = { discriminatorKey: 'assetType', collection: 'workspace_report_assets', timestamps: true };

const WorkspaceReportAssetSchema = new mongoose.Schema({}, options);

const WorkspaceReportAsset = mongoose.model('WorkspaceReportAsset', WorkspaceReportAssetSchema);

// 1. Main Report Schema
const WorkspaceReport = WorkspaceReportAsset.discriminator('WorkspaceReport', new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null }, 
  
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive', 'executive_summary'], required: true },
  
  content: { type: String }, 
  
  format: { type: String, enum: ['pdf', 'excel', 'csv', 'markdown'], default: 'pdf' },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'queued', 'running', 'collecting_metrics', 'generating_ai', 'building_charts', 'exporting'], default: 'pending' },
  reportStatus: { type: String, enum: ['Draft', 'Queued', 'Running', 'Collecting Metrics', 'Generating AI', 'Building Charts', 'Exporting', 'Completed', 'Failed', 'Under Review', 'Approved', 'Rejected', 'Archived', 'Deleted'], default: 'Draft' },
  downloadUrl: { type: String, default: null },
  
  isScheduled: { type: Boolean, default: false },
  scheduleFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  emailRecipients: [{ type: String }],
  lastRunAt: { type: Date, default: null },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  source: { type: String, enum: ['manual', 'reporting-agent'], default: 'manual' },
  agent: {
    agentKey: { type: String, default: null }, 
    dataSources: [{ type: String }], 
    summary: { type: String, default: null },
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }
  },

  reportTemplate: { type: String, default: 'default' },
  schemaVersion: { type: String, default: '1.0' },
  reportVersion: { type: Number, default: 1 },
  generatorVersion: { type: String, default: '1.0' },
  
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  generatedAt: { type: Date, default: null },
  comparedAudits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAudit' }],
  comparedDateRange: { 
    startDate: { type: Date }, 
    endDate: { type: Date } 
  },

  snapshot: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset' },
  metrics: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset' },
  execution: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset' },
  
  storageVersion: { type: String, default: '1.0' },
  reportChecksum: { type: String },
  reportSize: { type: Number },
  
  lastViewed: { type: Date },
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },

  archivedAt: { type: Date },
  deletedAt: { type: Date },
  scheduleHistory: [{ type: Object }],

  executiveSummary: { type: String },
  reportSummary: { type: String },
  recommendations: [{ type: String }],
  quickWins: [{ type: String }],
  biggestImprovements: [{ type: String }],
  biggestRegressions: [{ type: String }],
  criticalIssues: [{ type: String }],
  actionPlan: { type: String },
  chartDefinitions: { type: Object }
}), 'report');
WorkspaceReportAssetSchema.index({ agencyId: 1, createdAt: -1 }, { sparse: true });


// 2. Report Snapshot Schema
const WorkspaceReportSnapshot = WorkspaceReportAsset.discriminator('WorkspaceReportSnapshot', new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  auditSnapshot: { type: mongoose.Schema.Types.Mixed },
  techSeoSnapshot: { type: mongoose.Schema.Types.Mixed },
  keywordSnapshot: { type: mongoose.Schema.Types.Mixed },
  contentSnapshot: { type: mongoose.Schema.Types.Mixed },
  performanceSnapshot: { type: mongoose.Schema.Types.Mixed },
  cwvSnapshot: { type: mongoose.Schema.Types.Mixed },
  backlinkSnapshot: { type: mongoose.Schema.Types.Mixed },
  aeoSnapshot: { type: mongoose.Schema.Types.Mixed },
  geoSnapshot: { type: mongoose.Schema.Types.Mixed },
}), 'snapshot');


// 3. Report Metrics Schema
const WorkspaceReportMetrics = WorkspaceReportAsset.discriminator('WorkspaceReportMetrics', new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },

  seoScore: { type: Number },
  technicalScore: { type: Number },
  contentScore: { type: Number },
  performanceScore: { type: Number },
  coreWebVitals: { type: mongoose.Schema.Types.Mixed },
  keywordChanges: { type: mongoose.Schema.Types.Mixed },
  backlinkChanges: { type: mongoose.Schema.Types.Mixed },
  issueTrends: { type: mongoose.Schema.Types.Mixed },
  pageHealth: { type: mongoose.Schema.Types.Mixed },
  aeoMetrics: { type: mongoose.Schema.Types.Mixed },
  geoMetrics: { type: mongoose.Schema.Types.Mixed },
}), 'metrics');


// 4. Report Execution Schema
const WorkspaceReportExecution = WorkspaceReportAsset.discriminator('WorkspaceReportExecution', new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },

  generationDurationMs: { type: Number },
  aiLatencyMs: { type: Number },
  exportDurationMs: { type: Number },
  queueWaitTimeMs: { type: Number },
  
  retryCount: { type: Number, default: 0 },
  
  logs: [{
    level: { type: String, enum: ['info', 'warn', 'error'] },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
  }],
  
  failureReason: { type: String }
}), 'execution');


// 5. Report Share Schema
const WorkspaceReportShare = WorkspaceReportAsset.discriminator('WorkspaceReportShare', new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  shareToken: { type: String, required: true },
  accessType: { type: String, enum: ['public', 'password-protected'], default: 'public' },
  passwordHash: { type: String }, 
  
  expiresAt: { type: Date },
  isRevoked: { type: Boolean, default: false },
  
  views: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  
  accessLogs: [{
    ipAddress: { type: String },
    userAgent: { type: String },
    accessedAt: { type: Date, default: Date.now }
  }]
}), 'share');
WorkspaceReportAssetSchema.index({ shareToken: 1 }, { unique: true, sparse: true });


// 6. Report Export Schema
const WorkspaceReportExport = WorkspaceReportAsset.discriminator('WorkspaceReportExport', new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportAsset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  format: { type: String, enum: ['pdf', 'html', 'markdown', 'json', 'csv', 'docx'], required: true },
  fileUrl: { type: String }, 
  fileSize: { type: Number },
  
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
  failureReason: { type: String },
  
  downloads: { type: Number, default: 0 }
}), 'export');
WorkspaceReportAssetSchema.index({ reportId: 1, format: 1 }, { sparse: true });


module.exports = {
  WorkspaceReportAsset,
  WorkspaceReport,
  WorkspaceReportSnapshot,
  WorkspaceReportMetrics,
  WorkspaceReportExecution,
  WorkspaceReportShare,
  WorkspaceReportExport
};
