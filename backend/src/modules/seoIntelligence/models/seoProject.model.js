const mongoose = require('mongoose');

/**
 * SeoWebsite – stores SEO-specific configuration and cached stats
 * for a website that is tracked under an existing CRM Project.
 *
 * Linked to the existing `projects` collection via `projectId`.
 * Uses `companyId` to match the existing CRM tenant field (not agencyId).
 */
const SeoWebsiteSchema = new mongoose.Schema({
  // Link to existing CRM project (projects collection)
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false, index: true, default: null },

  // CRM tenant fields – mirrors the existing Project model naming
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Website identity
  domain: { type: String, required: true, trim: true, index: true },
  name:   { type: String, required: true },

  // DataForSEO configuration
  targetLocations: [{
    location_code:   { type: Number },
    location_name:   { type: String },
    country_iso_code: { type: String }
  }],
  searchEngines: [{ type: String, enum: ['google', 'bing', 'yahoo'], default: ['google'] }],
  languages: [{ type: String, default: ['en'] }],

  // Cached SEO stats (updated after each sync)
  stats: {
    totalKeywords:    { type: Number, default: 0 },
    top10Rankings:    { type: Number, default: 0 },
    avgVisibilityScore: { type: Number, default: 0 },
    lastAuditScore:   { type: Number, default: null },
    totalBacklinks:   { type: Number, default: 0 }
  },

  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  lastKeywordSync: { type: Date, default: null },
  lastAuditSync:   { type: Date, default: null },
  lastBacklinkSync: { type: Date, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

SeoWebsiteSchema.index({ companyId: 1, clientId: 1, isDeleted: 1 });
SeoWebsiteSchema.index({ domain: 1, companyId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('SeoWebsite', SeoWebsiteSchema);
