const mongoose = require('mongoose');

/**
 * CompetitorSnapshot — Enterprise Competitor Intelligence
 *
 * Stores a point-in-time capture of a competitor's key metrics so that
 * trend charts (7d / 30d / 90d / 180d / 365d) can be rendered without
 * re-querying external providers each time.
 *
 * Captures are triggered either:
 *   a) Manually via POST /competitor-intelligence/projects/:projectId/snapshot
 *   b) Automatically by workspaceCron.service.js (hook provided; schedule TBD)
 *
 * One document per (projectId, domain, capturedAt). Never updated after
 * insert — append-only to preserve history integrity.
 */
const CompetitorSnapshotSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceCompetitor', default: null },
  agencyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  domain:       { type: String, required: true, trim: true },

  metrics: {
    organicTraffic:    { type: Number, default: 0 },
    organicKeywords:   { type: Number, default: 0 },
    paidTraffic:       { type: Number, default: 0 },
    backlinks:         { type: Number, default: 0 },
    referringDomains:  { type: Number, default: 0 },
    domainRank:        { type: Number, default: 0 },
    authority:         { type: Number, default: 0 },  // 0–100 DR/DA equivalent
    estimatedRevenue:  { type: Number, default: 0 },  // organic cost × estimated multiplier
    indexedPages:      { type: Number, default: 0 },
    visibility:        { type: Number, default: 0 },  // 0–100 composite visibility score
    threatScore:       { type: Number, default: 0 },  // 0–100 from threatIntelligence.service
    opportunityScore:  { type: Number, default: 0 },  // 0–100 from opportunityEngine.service
    aiVisibility:      { type: Number, default: 0 },  // 0–100 GEO/AI mention score (future)
  },

  dataSource:  { type: String, enum: ['dataforseo', 'semrush', 'ai-estimate', 'manual'], default: 'dataforseo' },
  capturedAt:  { type: Date, default: Date.now, index: true }
}, {
  // No `timestamps` — capturedAt IS the timestamp; updatedAt would be misleading
  // for an append-only model.
  timestamps: false
});

// Primary query: "give me all snapshots for domain D in project P, newest first"
CompetitorSnapshotSchema.index({ projectId: 1, domain: 1, capturedAt: -1 });

// Secondary: purge old snapshots per project (optional future cron)
CompetitorSnapshotSchema.index({ projectId: 1, capturedAt: 1 });

module.exports = mongoose.model('CompetitorSnapshot', CompetitorSnapshotSchema, 'competitor_snapshots');
