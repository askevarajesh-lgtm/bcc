const mongoose = require('mongoose');

const WorkspaceMonitoringAlertSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  category: { type: String, required: true }, // e.g., 'Rank Drop', 'Crawl Error', 'SSL', 'Core Web Vitals'
  source: { type: String, required: true },   // e.g., 'KeywordMonitor', 'TrafficMonitor'
  
  entityType: { type: String, required: true }, // e.g., 'Keyword', 'Page', 'Competitor'
  entityId: { type: String, required: true },   // Can be ObjectId string or URL
  
  status: { type: String, enum: ['Open', 'Acknowledged', 'Resolved', 'Dismissed'], default: 'Open', index: true },
  
  firstDetected: { type: Date, default: Date.now },
  lastDetected: { type: Date, default: Date.now },
  occurrences: { type: Number, default: 1 },
  
  resolvedAt: { type: Date },
  acknowledgedAt: { type: Date },
  resolutionNotes: { type: String },
  
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Minimal AI summary directly on alert for quick display
  // Detailed recommendations are in workspaceMonitoringRecommendation
  aiSummary: { type: String, default: null }
}, { timestamps: true });

WorkspaceMonitoringAlertSchema.index({ projectId: 1, status: 1 });
WorkspaceMonitoringAlertSchema.index({ projectId: 1, category: 1 });
WorkspaceMonitoringAlertSchema.index({ entityType: 1, entityId: 1, status: 1 });

module.exports = mongoose.model('WorkspaceMonitoringAlert', WorkspaceMonitoringAlertSchema, 'workspace_monitoring_alerts');
