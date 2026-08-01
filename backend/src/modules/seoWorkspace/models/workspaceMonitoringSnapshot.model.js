const mongoose = require('mongoose');

const WorkspaceMonitoringSnapshotSchema = new mongoose.Schema({
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
}, { timestamps: true });

WorkspaceMonitoringSnapshotSchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model('WorkspaceMonitoringSnapshot', WorkspaceMonitoringSnapshotSchema, 'workspace_monitoring_snapshots');
