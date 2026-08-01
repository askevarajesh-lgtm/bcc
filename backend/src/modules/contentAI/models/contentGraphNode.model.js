const mongoose = require('mongoose');

const ContentGraphNodeSchema = new mongoose.Schema({
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
}, { timestamps: true });

ContentGraphNodeSchema.index({ workspaceId: 1, nodeType: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ContentGraphNode', ContentGraphNodeSchema);
