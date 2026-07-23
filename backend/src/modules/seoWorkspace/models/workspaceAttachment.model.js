const mongoose = require('mongoose');

// Polymorphic attachment collection, same pattern as WorkspaceComment.
// Files are stored via Cloudinary (existing config/cloudinary.js) — this
// model just tracks the resulting URL/metadata, no new storage handling.
const WorkspaceAttachmentSchema = new mongoose.Schema({
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
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, default: null }, // mimetype
  fileSize: { type: Number, default: null }, // bytes
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

WorkspaceAttachmentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceAttachment', WorkspaceAttachmentSchema, 'workspace_attachments');
