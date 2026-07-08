const mongoose = require('mongoose');

const WorkspaceKeywordSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  keyword: { type: String, required: true, trim: true },
  locationCode: { type: Number, default: 2840 }, // Default US
  languageCode: { type: String, default: 'en' },
  
  // DataForSEO specific identifiers (to avoid duplicate tracking tasks)
  taskId: { type: String, default: null },

  // Latest Metrics (Cached for fast retrieval)
  metrics: {
    searchVolume: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    competition: { type: Number, default: 0 }, // 0 to 1
    keywordDifficulty: { type: Number, default: 0 }, // 0 to 100
    intent: { type: String, enum: ['informational', 'navigational', 'commercial', 'transactional', 'unknown'], default: 'unknown' }
  },

  // Ranking data
  ranking: {
    currentRank: { type: Number, default: null },
    previousRank: { type: Number, default: null },
    bestRank: { type: Number, default: null },
    url: { type: String, default: null }, // URL that is ranking
    isFeaturedSnippet: { type: Boolean, default: false }
  },

  // Tags for organizing keywords
  tags: [{ type: String }],
  
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure unique keywords per project
WorkspaceKeywordSchema.index({ projectId: 1, keyword: 1, locationCode: 1, languageCode: 1 }, { unique: true });

// Fast queries for dashboard
WorkspaceKeywordSchema.index({ projectId: 1, 'ranking.currentRank': 1 });

module.exports = mongoose.model('WorkspaceKeyword', WorkspaceKeywordSchema, 'workspace_keywords');
