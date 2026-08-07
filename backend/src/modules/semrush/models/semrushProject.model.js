const mongoose = require('mongoose');

const semrushProjectSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: {
    aiVisibility: { type: Number, default: 0 },
    mentions: { type: Number, default: 0 },
    siteHealth: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 },
    organicTraffic: { type: Number, default: 0 },
    organicKeywords: { type: Number, default: 0 },
    backlinks: { type: Number, default: 0 }
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
  lastRefresh: {
    type: Date,
    default: null
  },
  moduleRefreshes: {
    domainOverview: { type: Date, default: null },
    organicKeywords: { type: Date, default: null },
    backlinks: { type: Date, default: null },
    siteHealth: { type: Date, default: null },
    positionTracking: { type: Date, default: null },
  },
  apiSyncStatus: {
    status: { type: String, enum: ['idle', 'syncing', 'error'], default: 'idle' },
    lastError: { type: String, default: null },
    lastSyncAttempt: { type: Date, default: null }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

semrushProjectSchema.index({ companyId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('SemrushProject', semrushProjectSchema);
