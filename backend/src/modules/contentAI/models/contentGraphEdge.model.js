const mongoose = require('mongoose');

const ContentGraphEdgeSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  sourceNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentGraphNode', required: true, index: true },
  targetNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentGraphNode', required: true, index: true },
  
  relationType: {
    type: String,
    enum: ['LINKS_TO', 'MENTIONS', 'COMPETES_WITH', 'PART_OF_CLUSTER', 'TARGETS_KEYWORD'],
    required: true
  },
  
  weight: { type: Number, default: 1 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ContentGraphEdgeSchema.index({ sourceNodeId: 1, targetNodeId: 1, relationType: 1 }, { unique: true });

module.exports = mongoose.model('ContentGraphEdge', ContentGraphEdgeSchema);
