const mongoose = require('mongoose');

const SemrushProjectSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  domain: { type: String, required: true, trim: true, index: true },
  name: { type: String, required: true },
  
  // Dashboard Metrics
  stats: {
    aiVisibility: { type: Number, default: 0 },
    mentions: { type: Number, default: 0 },
    siteHealth: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 },
    organicTraffic: { type: Number, default: 0 },
    organicKeywords: { type: Number, default: 0 },
    backlinks: { type: Number, default: 0 },
    trafficTrend: { type: Number, default: 0 },
    keywordsTrend: { type: Number, default: 0 },
    backlinksTrend: { type: Number, default: 0 },
  },
  
  trackingConfig: {
    isActive: { type: Boolean, default: false },
    searchEngine: { type: String, default: 'Google' },
    device: { type: String, default: 'Desktop' },
    location: { type: String, default: 'us' },
    businessName: { type: String, default: '' },
    keywords: [{ type: String }],
    lastUpdated: { type: Date, default: null }
  },

  lastRefresh: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

SemrushProjectSchema.index({ companyId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('SemrushProject', SemrushProjectSchema, 'semrush_projects');
