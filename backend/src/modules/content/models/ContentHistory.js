const mongoose = require('mongoose');

const contentHistorySchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  contentItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
  },
  action: {
    type: String,
    required: true,
    // e.g., 'generated', 'humanized', 'status_changed', 'synced_seo', 'synced_blog', 'published'
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // flexible metadata about the event
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

contentHistorySchema.index({ contentItemId: 1, createdAt: -1 });

module.exports = mongoose.model('ContentHistory', contentHistorySchema);
