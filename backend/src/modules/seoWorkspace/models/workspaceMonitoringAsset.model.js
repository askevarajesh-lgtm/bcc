const mongoose = require('mongoose');

const options = { discriminatorKey: 'assetType', collection: 'workspace_monitoring_assets', timestamps: true };

const WorkspaceMonitoringAssetSchema = new mongoose.Schema({}, options);

WorkspaceMonitoringAssetSchema.index({ projectId: 1 });
WorkspaceMonitoringAssetSchema.index({ createdAt: -1 });

const WorkspaceMonitoringAsset = mongoose.model('WorkspaceMonitoringAsset', WorkspaceMonitoringAssetSchema);

// 1. Monitoring Scan Model
const WorkspaceMonitoringScan = WorkspaceMonitoringAsset.discriminator('WorkspaceMonitoringScan', new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  scanId: { type: String, required: true }, 
  
  status: { 
    type: String, 
    enum: ['Queued', 'Running', 'Paused', 'Completed', 'Failed', 'Cancelled', 'Retrying'], 
    default: 'Queued',
    index: true 
  },
  
  startedAt: { type: Date },
  finishedAt: { type: Date },
  durationMs: { type: Number },
  
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  worker: { type: String }, 
  error: { type: String }, 
  
  resultsSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
}), 'scan');
// Ensure unique scanId only for scans
WorkspaceMonitoringAssetSchema.index({ scanId: 1 }, { unique: true, partialFilterExpression: { assetType: 'scan' } });

// 2. Monitoring Snapshot Model
const WorkspaceMonitoringSnapshot = WorkspaceMonitoringAsset.discriminator('WorkspaceMonitoringSnapshot', new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  
  healthScore: { type: Number, default: 0 },
  
  keywordSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  trafficSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  competitorSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  alerts: { type: mongoose.Schema.Types.Mixed, default: {} },
  crawl: { type: mongoose.Schema.Types.Mixed, default: {} },
  coreWebVitals: { type: mongoose.Schema.Types.Mixed, default: {} },
  uptime: { type: mongoose.Schema.Types.Mixed, default: {} },
  ssl: { type: mongoose.Schema.Types.Mixed, default: {} },
  robots: { type: mongoose.Schema.Types.Mixed, default: {} },
  sitemap: { type: mongoose.Schema.Types.Mixed, default: {} },
  indexStatus: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiVisibility: { type: mongoose.Schema.Types.Mixed, default: {} }
}), 'snapshot');
WorkspaceMonitoringAssetSchema.index({ projectId: 1, timestamp: -1 }, { sparse: true });


// 3. Monitoring Alert Model
const WorkspaceMonitoringAlert = WorkspaceMonitoringAsset.discriminator('WorkspaceMonitoringAlert', new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  category: { type: String, required: true }, 
  source: { type: String, required: true },   
  
  // Note: renamed entityType to alertEntityType because entityType conflicts with discriminatorKey if named 'entityType'. 
  // Wait, I named discriminatorKey 'assetType' so 'entityType' is fine here! Let's keep it 'entityType'.
  entityType: { type: String, required: true }, 
  entityId: { type: String, required: true },   
  
  status: { type: String, enum: ['Open', 'Acknowledged', 'Resolved', 'Dismissed'], default: 'Open', index: true },
  
  firstDetected: { type: Date, default: Date.now },
  lastDetected: { type: Date, default: Date.now },
  occurrences: { type: Number, default: 1 },
  
  resolvedAt: { type: Date },
  acknowledgedAt: { type: Date },
  resolutionNotes: { type: String },
  
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  aiSummary: { type: String, default: null }
}), 'alert');

WorkspaceMonitoringAssetSchema.index({ projectId: 1, status: 1 }, { sparse: true });
WorkspaceMonitoringAssetSchema.index({ projectId: 1, category: 1 }, { sparse: true });
WorkspaceMonitoringAssetSchema.index({ entityType: 1, entityId: 1, status: 1 }, { sparse: true });

// 4. Monitoring Recommendation Model
const WorkspaceMonitoringRecommendation = WorkspaceMonitoringAsset.discriminator('WorkspaceMonitoringRecommendation', new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceMonitoringAsset', required: true, index: true },
  
  rootCause: { type: String, required: true },
  recommendation: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  
  status: { type: String, enum: ['Pending', 'Accepted', 'Ignored', 'Resolved'], default: 'Pending', index: true },
  
  linkedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' },
  
  generatedBy: { type: String, default: 'ai' }, 
}), 'recommendation');


module.exports = {
  WorkspaceMonitoringAsset,
  WorkspaceMonitoringScan,
  WorkspaceMonitoringSnapshot,
  WorkspaceMonitoringAlert,
  WorkspaceMonitoringRecommendation
};
