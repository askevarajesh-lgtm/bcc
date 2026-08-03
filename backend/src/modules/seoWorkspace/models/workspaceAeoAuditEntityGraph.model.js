const mongoose = require('mongoose');

const WorkspaceAeoAuditEntityGraphSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAudit', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  pageUrl: { type: String, required: true },

  nodes: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Organization', 'Person', 'Product', 'Service', 'Brand', 'Location', 'Technology', 'Event', 'Topic', 'Other'],
      default: 'Other'
    },
    confidence: { type: Number, min: 0, max: 100, default: null }
  }],
  
  edges: [{
    source: { type: String, required: true }, // matches node id
    target: { type: String, required: true }, // matches node id
    relationship: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, default: null }
  }]
}, { timestamps: true });

WorkspaceAeoAuditEntityGraphSchema.index({ auditId: 1, pageUrl: 1 }, { unique: true });
WorkspaceAeoAuditEntityGraphSchema.index({ projectId: 1 });

module.exports = mongoose.model('WorkspaceAeoAuditEntityGraph', WorkspaceAeoAuditEntityGraphSchema, 'workspace_aeo_audit_entity_graphs');
