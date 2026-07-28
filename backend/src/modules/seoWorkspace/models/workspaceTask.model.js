const mongoose = require('mongoose');

const WorkspaceTaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceStrategy',
    required: false
  },
  pageUrl: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  proposedChanges: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Implemented', 'Failed'],
    default: 'Pending'
  },
  failureReason: {
    type: String,
    default: null
  },
  source: { type: String, enum: ['manual', 'monitoring-agent'], default: 'manual' },
  agent: {
    agentKey: { type: String, default: null }, 
    sourceKeywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceKeyword', default: null },
    dropAmount: { type: Number, default: null },
    rationale: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceTask', WorkspaceTaskSchema, 'workspace_tasks');