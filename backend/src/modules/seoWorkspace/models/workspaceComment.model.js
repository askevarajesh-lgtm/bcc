const mongoose = require('mongoose');
const WorkspaceCommentSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['Strategy', 'Task', 'Report'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

WorkspaceCommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceComment', WorkspaceCommentSchema, 'workspace_comments');
