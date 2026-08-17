const mongoose = require('mongoose');

const options = { discriminatorKey: 'elementType', collection: 'content_graph_elements', timestamps: true };

const ContentGraphSchema = new mongoose.Schema({}, options);

ContentGraphSchema.index({ workspaceId: 1 }, { sparse: true });

const ContentGraphElement = mongoose.model('ContentGraphElement', ContentGraphSchema);

// 1. Content Graph Node
const ContentGraphNode = ContentGraphElement.discriminator('ContentGraphNode', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  nodeType: {
    type: String,
    enum: ['Keyword', 'Entity', 'Competitor', 'Page', 'TopicCluster'],
    required: true,
    index: true
  },
  
  name: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  isDeleted: { type: Boolean, default: false }
}), 'node');

ContentGraphSchema.index({ workspaceId: 1, nodeType: 1, name: 1 }, { unique: true, sparse: true });


// 2. Content Graph Edge
const ContentGraphEdge = ContentGraphElement.discriminator('ContentGraphEdge', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  sourceNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentGraphElement', required: true, index: true },
  targetNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentGraphElement', required: true, index: true },
  
  relationType: {
    type: String,
    enum: ['LINKS_TO', 'MENTIONS', 'COMPETES_WITH', 'PART_OF_CLUSTER', 'TARGETS_KEYWORD'],
    required: true
  },
  
  weight: { type: Number, default: 1 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}), 'edge');

ContentGraphSchema.index({ sourceNodeId: 1, targetNodeId: 1, relationType: 1 }, { unique: true, sparse: true });

module.exports = {
  ContentGraphElement,
  ContentGraphNode,
  ContentGraphEdge
};
