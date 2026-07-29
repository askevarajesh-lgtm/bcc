const mongoose = require('mongoose');

/**
 * One row per AI keyword recommendation ever made, tracking what happened
 * to it after the fact. Deliberately separate from `WorkspaceKeyword.status`
 * (Suggested/Approved/Rejected), which only holds the *current* state of a
 * keyword — this collection is an append-only history so the same keyword
 * can be recommended, rejected, then recommended again later and both
 * outcomes are preserved for the AI to learn from.
 *
 * `sharedMemory`/`WorkspaceMemory` already exists for coarse, human-authored
 * lessons ("avoid theme X"). This model is the fine-grained, per-keyword
 * ledger that feeds a quantitative signal (acceptance rate, ranking lift)
 * rather than a free-text note.
 */
const RecommendationMemorySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  keywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceKeyword', default: null },
  keyword: { type: String, required: true, trim: true },

  agentKey: { type: String, default: null }, // e.g. 'keyword-research'
  theme: { type: String, default: null },
  opportunityScore: { type: Number, default: null },
  rationale: { type: String, default: null },

  // Lifecycle of this specific recommendation.
  status: {
    type: String,
    enum: ['recommended', 'accepted', 'rejected', 'ignored'],
    default: 'recommended',
    index: true
  },
  respondedAt: { type: Date, default: null },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: null },

  // Populated later, once ranking data is available for an accepted keyword.
  outcome: {
    tracked: { type: Boolean, default: false },
    rankBefore: { type: Number, default: null },
    rankAfter: { type: Number, default: null },
    rankImprovement: { type: Number, default: null }, // rankBefore - rankAfter, positive = better
    measuredAt: { type: Date, default: null },
    successful: { type: Boolean, default: null } // null = not yet evaluated
  }
}, { timestamps: true });

RecommendationMemorySchema.index({ projectId: 1, keyword: 1, createdAt: -1 });
RecommendationMemorySchema.index({ projectId: 1, theme: 1, status: 1 });

module.exports = mongoose.model('WorkspaceRecommendationMemory', RecommendationMemorySchema, 'workspace_recommendation_memory');
