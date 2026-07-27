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
  lastRefresh: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

semrushProjectSchema.index({ companyId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('SemrushProject', semrushProjectSchema);
