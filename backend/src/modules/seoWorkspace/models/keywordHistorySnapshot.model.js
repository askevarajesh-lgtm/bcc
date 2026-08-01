const mongoose = require('mongoose');

const KeywordHistorySnapshotSchema = new mongoose.Schema({
  keywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceKeyword', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  keyword: { type: String, required: true },
  
  date: { type: Date, required: true, index: true },
  snapshotType: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true, index: true },
  
  ranking: {
    rank: { type: Number, default: null },
    url: { type: String, default: null },
    source: { type: String, enum: ['GSC', 'DataForSEO', 'UNAVAILABLE'], default: 'UNAVAILABLE' },
    searchEngine: { type: String, default: 'Google' },
    device: { type: String, default: 'Unknown' },
    locationCode: { type: Number },
    languageCode: { type: String }
  },
  
  metrics: {
    searchVolume: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    keywordDifficulty: { type: Number, default: 0 },
    competition: { type: Number, default: 0 },
    estimatedTraffic: { type: Number, default: 0 }
  },
  
  serpFeatures: [{ type: String }],
  
}, { timestamps: true });

// Ensure unique snapshot per keyword per day/week/month
KeywordHistorySnapshotSchema.index({ keywordId: 1, date: 1, snapshotType: 1 }, { unique: true });

module.exports = mongoose.model('KeywordHistorySnapshot', KeywordHistorySnapshotSchema, 'keyword_history_snapshots');
