const mongoose = require('mongoose');

const WorkspaceGeoPageAnalysisSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAudit', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  url: { type: String, required: true },
  contentHash: { type: String, required: true }, // For incremental analysis caching

  // Granular page-level metrics
  schemaScore: { type: Number, min: 0, max: 100, default: null },
  contentScore: { type: Number, min: 0, max: 100, default: null },
  authorityScore: { type: Number, min: 0, max: 100, default: null },
  
  // Evidence array
  evidence: [{
    type: { type: String }, // 'schema', 'content', 'authority'
    severity: { type: String },
    message: { type: String },
    source: { type: String }
  }]
}, { timestamps: true });

WorkspaceGeoPageAnalysisSchema.index({ auditId: 1, url: 1 });

module.exports = mongoose.model('WorkspaceGeoPageAnalysis', WorkspaceGeoPageAnalysisSchema, 'workspace_geo_page_analysis');
