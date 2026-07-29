const mongoose = require('mongoose');

/**
 * Caches keyword-provider responses (suggestions, volume, difficulty, SERP,
 * trend, related, question keywords) so repeat lookups for the same
 * project/keyword/params don't re-bill DataForSEO/Semrush inside the TTL
 * window. `expiresAt` drives a Mongo TTL index — documents are reaped
 * automatically, no cron needed.
 */
const KeywordCacheSchema = new mongoose.Schema({
  // Which keyword feature this entry belongs to — used only for
  // diagnostics/manual invalidation, TTL itself is per-document via expiresAt.
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
      'question_keywords'
    ],
    index: true
  },
  // Deterministic hash/string of {operation + normalized params}. Unique so
  // set() can safely upsert.
  cacheKey: { type: String, required: true, unique: true },
  providerId: { type: String, default: null }, // which provider actually served this
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

KeywordCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WorkspaceKeywordCache', KeywordCacheSchema, 'workspace_keyword_cache');
