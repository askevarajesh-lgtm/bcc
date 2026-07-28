const mongoose = require('mongoose');

const WorkspaceStrategySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String, // Markdown string
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Published'],
    default: 'Draft'
  },
  dateGenerated: {
    type: Date,
    default: Date.now
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceStrategy', WorkspaceStrategySchema, 'workspace_strategies');