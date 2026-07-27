const mongoose = require('mongoose');

// New collection — no pre-existing competitor data anywhere in the codebase
// to stay backward-compatible with (confirmed: grep for "competitor" across
// backend/src turned up only the raw, unpersisted seoIntelligence.controller
// getCompetitors endpoint and an orchestrator skill-name reference — neither
// writes to a model). Shape mirrors WorkspaceKeyword's
// objective-metrics + agent{} + approval-gate pattern for consistency with
// the SEO Auditor / Keyword Research agents, not because anything requires it.
const WorkspaceCompetitorSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  domain: { type: String, required: true, trim: true },

  // Objective metrics — from DataForSEO (getCompetitors / getDomainOverview /
  // getBacklinkSummary, all pre-existing methods) or Semrush's getDomainOverview
  // as a secondary source. Left at 0 when neither is configured/available
  // (see competitorAgent.service.js's AI-fallback note — no fabricated numbers).
  metrics: {
    commonKeywords: { type: Number, default: 0 }, // keyword overlap with the tracked project's domain
    organicKeywords: { type: Number, default: 0 },
    organicTraffic: { type: Number, default: 0 }, // estimated traffic value / organic traffic
    organicCost: { type: Number, default: 0 }, // estimated paid-traffic-equivalent cost
    referringDomains: { type: Number, default: 0 },
    backlinks: { type: Number, default: 0 },
    domainRank: { type: Number, default: 0 }
  },

  dataSource: { type: String, enum: ['dataforseo', 'semrush', 'ai-estimate'], default: 'dataforseo' },

  source: { type: String, enum: ['manual', 'competitor-agent'], default: 'competitor-agent' },
  status: { type: String, enum: ['Suggested', 'Approved', 'Rejected'], default: 'Suggested' },

  agent: {
    agentKey: { type: String, default: null }, // 'competitor-agent'; data reference only
    threatLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    contentGaps: [{ type: String }],
    rationale: { type: String, default: null }
  },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// One tracked entry per competitor domain per project — re-running the agent
// upserts onto the same doc (see run()'s $setOnInsert) instead of creating dupes.
WorkspaceCompetitorSchema.index({ projectId: 1, domain: 1 }, { unique: true });
WorkspaceCompetitorSchema.index({ projectId: 1, 'metrics.organicTraffic': -1 });

module.exports = mongoose.model('WorkspaceCompetitor', WorkspaceCompetitorSchema, 'workspace_competitors');
