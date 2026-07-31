const mongoose = require('mongoose');

const WorkspaceProjectSchema = new mongoose.Schema({
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

  // --- AI Agent Extensions ---
  phase: { type: String, enum: ['intake', 'audit', 'strategy', 'implementation', 'reaudit', 'report', 'monitoring', 'complete'], default: 'intake' },
  phasesCompleted: [{ type: String }],
  approvals: {
    strategyApproved: { type: Boolean, default: false },
    strategyApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    strategyApprovedAt: { type: Date }
  },
  credentials: {
    wpRestApiUrl: { type: String },
    wpUsername: { type: String },
    wpAppPassword: { type: String },
    gscServiceAccount: { type: String },
    ga4PropertyId: { type: String }
  },
  settings: {
    autopilot: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'manual'], default: 'weekly' },
    budget: {
      dailyProviderLimit: { type: Number, default: 500 },
      monthlyProviderLimit: { type: Number, default: 10000 }
    }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

WorkspaceProjectSchema.index({ companyId: 1, clientId: 1, isDeleted: 1 });
WorkspaceProjectSchema.index({ domain: 1, companyId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceProject', WorkspaceProjectSchema, 'workspace_projects');
