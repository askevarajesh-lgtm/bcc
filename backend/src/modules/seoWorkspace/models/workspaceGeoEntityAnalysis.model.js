const mongoose = require('mongoose');

const WorkspaceGeoEntityAnalysisSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceGeoAudit', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  overallEntityScore: { type: Number, min: 0, max: 100, default: null },
  knowledgeGraphScore: { type: Number, min: 0, max: 100, default: null },
  
  // Entity Graph structure
  entities: [{
    name: { type: String },
    type: { type: String }, // Organization, Product, Person
    occurrences: { type: Number },
    relatedPages: [{ type: String }]
  }],

  // Relationships (e.g., Organization -> Products)
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
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceGeoEntityAnalysis', WorkspaceGeoEntityAnalysisSchema, 'workspace_geo_entity_analysis');
