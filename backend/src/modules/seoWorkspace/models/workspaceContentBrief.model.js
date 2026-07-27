const mongoose = require('mongoose');

/**
 * Content Agent's own persisted run output.
 *
 * A new collection, not a reuse of `WorkspaceTask` (which represents an
 * *implementation* action, not a content brief) or `WorkspaceKeyword`
 * (which represents a keyword, not a full brief for one). Follows the same
 * "own collection per agent" precedent as `WorkspaceTechnicalAudit` and
 * `WorkspaceCompetitor` — see `workspaceTechnicalAudit.model.js`'s header
 * for the full reasoning: interleaving a differently-shaped agent output
 * into an existing collection that other code already reads with
 * assumptions about its shape (latest-doc lookups, diffing, list views)
 * silently corrupts those reads rather than crashing them.
 *
 * Shape deliberately mirrors `WorkspaceTechnicalAudit`'s `agent` sub-schema
 * (summary/findings-equivalent/approvalStatus/approvedBy/approvedAt/
 * rejectionReason/generatedTaskIds) so the approval-gate and
 * task-generation code in `contentAgent.service.js` reads the same as the
 * other four agents in this module — consistency of pattern, not a shared
 * collection.
 */
const WorkspaceContentBriefSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectContentInputs) — kept
  // alongside the analyzed briefs so a human/agent can see exactly what
  // candidate data the AI's briefs were grounded in.
  inputs: {
    candidateKeywords: [{
      keyword: { type: String },
      searchVolume: { type: Number, default: 0 },
      keywordDifficulty: { type: Number, default: 0 },
      intent: { type: String, default: 'unknown' }
    }],
    existingPages: [{
      url: { type: String },
      title: { type: String }
    }],
    // 'internal-only' when the light existing-pages crawl pass failed or
    // returned nothing — never fabricated, mirrors
    // WorkspaceTechnicalAudit.signals.dataSource's honesty convention.
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'content-agent'; data reference only
    summary: { type: String, default: null },
    briefs: [{
      title: { type: String, required: true },
      contentType: {
        type: String,
        enum: ['blog_post', 'landing_page', 'pillar_page', 'product_page'],
        default: 'blog_post'
      },
      // Must exactly match a keyword from inputs.candidateKeywords — enforced
      // in contentAgent.service.js#analyzeAndGenerateBriefs, same
      // hallucination guard keywordResearchAgent.service.js uses.
      targetKeyword: { type: String, required: true },
      secondaryKeywords: [{ type: String }],
      recommendedAction: { type: String, enum: ['new_page', 'update_existing'], default: 'new_page' },
      // Only set when recommendedAction is 'update_existing', and only ever
      // to a URL that was actually in inputs.existingPages — never invented.
      targetUrl: { type: String, default: null },
      outline: [{ type: String }],
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      wordCountTarget: { type: Number, default: null },
      theme: { type: String, default: 'general' }, // cluster label; used to detect repeated rejections
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Reuses the existing WorkspaceTask taskType enum's 'Content Edit'
    // value — no schema change to that model needed.
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceContentBriefSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceContentBrief', WorkspaceContentBriefSchema, 'workspace_content_briefs');
