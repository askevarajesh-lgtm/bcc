const mongoose = require('mongoose');

const WorkspaceReportMetricsSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReport', required: true, index: true },
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
  
}, { timestamps: true });

WorkspaceReportMetricsSchema.index({ reportId: 1 });

module.exports = mongoose.model('WorkspaceReportMetrics', WorkspaceReportMetricsSchema, 'workspace_report_metrics');
