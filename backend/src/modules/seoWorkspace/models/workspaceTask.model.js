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
  // Additive: populated when a WordPress publish attempt fails, so the UI can
  // show *why* instead of just a bare 'Failed' tag.
  failureReason: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceTask', WorkspaceTaskSchema, 'workspace_tasks');