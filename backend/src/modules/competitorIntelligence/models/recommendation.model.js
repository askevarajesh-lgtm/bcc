const mongoose = require('mongoose');

/**
 * Recommendation — AI SEO Platform v2 §2.
 *
 * One row per AI-generated recommendation produced from a `ComparisonResult`
 * row. `seoTaskGenerator.service.js` (§3) converts these into
 * `WorkspaceTask` docs; `recommendationMemory` mirroring (§8) tracks what
 * happens to each one after the fact via `comparisonId` + `item`.
 */
const RecommendationSchema = new mongoose.Schema({
  comparisonId: { type: String, required: true, index: true }, // ties back to the ComparisonResult that produced it
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: ['keyword_gap', 'content_gap', 'backlink_gap', 'page_gap'],
    required: true
  },

  item: { type: mongoose.Schema.Types.Mixed, required: true }, // the underlying ComparisonRow this recommendation is about
  rationale: { type: String, required: true },
  priorityScore: { type: Number, required: true }, // deterministic pre-score, see competitorRecommendation.service.js
  estimatedTrafficImpact: { type: Number, default: 0 }, // never fabricated — 0 when inputs are missing
  effortHint: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

  status: {
    type: String,
    enum: ['proposed', 'converted_to_task', 'dismissed'],
    default: 'proposed',
    index: true
  },

  agent: {
    agentKey: { type: String, default: null },
    rationaleSource: { type: String, enum: ['ai', 'deterministic-fallback'], default: 'ai' }
  }
}, { timestamps: true });

RecommendationSchema.index({ projectId: 1, comparisonId: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema, 'competitor_intelligence_recommendations');
