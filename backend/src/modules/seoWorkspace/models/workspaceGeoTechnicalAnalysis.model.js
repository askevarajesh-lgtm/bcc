const mongoose = require('mongoose');

const WorkspaceGeoTechnicalAnalysisSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAudit', required: true, index: true },
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
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceGeoTechnicalAnalysis', WorkspaceGeoTechnicalAnalysisSchema, 'workspace_geo_technical_analysis');
