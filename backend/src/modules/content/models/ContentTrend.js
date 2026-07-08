const mongoose = require('mongoose');

const contentTrendSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  channel: {
    type: String,
    enum: ['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  angle: String,
  keywords: [String],
  trendScore: Number, // e.g., 1-100
  source: String,
  isSavedIdea: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

contentTrendSchema.index({ workspaceId: 1, channel: 1 });

module.exports = mongoose.model('ContentTrend', contentTrendSchema);
