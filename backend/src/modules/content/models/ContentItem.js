const mongoose = require('mongoose');

const contentItemSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'ContentProject', // Optional, commenting out for v1
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Draft',
  },
  
  // AI Generation Inputs
  topic: String,
  platform: String,
  tone: String,
  brandVoice: String,
  keyMessage: String,
  includeOptions: [String],
  characterLimit: Number,
  
  // Generated Content Fields
  title: String,
  body: String,
  excerpt: String,
  category: String,
  metaTitle: String,
  metaDescription: String,
  keyword: String,
  hashtags: [String],
  cta: String,

  // Downstream sync references
  linkedSeoContentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeoContent',
  },
  linkedWebsitePageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsitePage',
  },
  linkedBlogPostKey: String, // Since postList uses a key or _id
  linkedPublishHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PublishHistory',
  },
  
  // Sync Statuses
  seoSyncStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  blogSyncStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  
  // Scheduling
  scheduledDate: Date,
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

}, { timestamps: true });

// Indexes per Blueprint Section 5
contentItemSchema.index({ projectId: 1, status: 1 });
contentItemSchema.index({ projectId: 1, type: 1 });
contentItemSchema.index({ scheduledDate: 1 });
contentItemSchema.index({ assigneeId: 1, status: 1 });
contentItemSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('ContentItem', contentItemSchema);
