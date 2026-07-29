const mongoose = require('mongoose');

const KeywordCacheSchema = new mongoose.Schema({
  operation: {
    type: String,
    required: true,
    enum: [
      'keyword_suggestions',
      'search_volume',
      'keyword_difficulty',
      'serp',
      'trend',
      'related_keywords',
      'question_keywords',
      'keyword_gap',
      'content_gap',
      'backlink_gap',
      'page_gap',
      'overview'
    ],
    index: true
  },
  cacheKey: { type: String, required: true, unique: true },
  providerId: { type: String, default: null }, // which provider actually served this
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

KeywordCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WorkspaceKeywordCache', KeywordCacheSchema, 'workspace_keyword_cache');