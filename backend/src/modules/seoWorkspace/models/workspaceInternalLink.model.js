const mongoose = require('mongoose');

/**
 * Internal Linking Agent's own persisted run output.
 *
 * A new collection, not a reuse of `WorkspaceTechnicalAudit`/
 * `WorkspaceSchemaMarkup`/`WorkspaceContentBrief` — same "own collection
 * per agent" precedent those three already establish (see
 * `workspaceSchemaMarkup.model.js`'s header): this run's shape is a list
 * of proposed source→target hyperlinks with anchor text, not a page-type
 * classification, a findings list, or a content brief, and folding it into
 * one of those would silently corrupt other code's assumptions about that
 * collection's shape.
 *
 * Shape deliberately mirrors the other agents' `agent` sub-schema
 * (summary/items-array/approvalStatus/approvedBy/approvedAt/
 * rejectionReason/generatedTaskIds) so the approval-gate and
 * task-generation code in `internalLinkingAgent.service.js` reads the same
 * as every other agent in this module.
 */
const WorkspaceInternalLinkSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectLinkGraphSignals) — kept
  // alongside the generated suggestions so a human/agent can see exactly
  // what link-graph data the AI's suggestions were grounded in. No AI
  // involved in this phase; inboundLinkCount is a deterministic count over
  // the crawled pages' own outbound links, never AI-estimated.
  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      wordCount: { type: Number, default: 0 },
      indexable: { type: Boolean, default: null },
      outboundInternalLinks: [{ type: String }], // same-host links this page points to, within the crawled set
      inboundLinkCount: { type: Number, default: 0 }, // how many other crawled pages link to this one
      isOrphan: { type: Boolean, default: false } // inboundLinkCount === 0 and not the homepage
    }],
    existingLinks: [{
      sourceUrl: { type: String },
      targetUrl: { type: String }
    }],
    // 'internal-only' when the light crawl pass failed or returned
    // nothing — never fabricated, mirrors the other agents' inputs
    // .dataSource honesty convention.
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'internal-linking-agent'; data reference only
    summary: { type: String, default: null },
    suggestions: [{
      // Both must exactly match one of inputs.pages[].url — enforced in
      // internalLinkingAgent.service.js#generateLinkSuggestions, same
      // hallucination guard the other agents' analysis phases use.
      sourceUrl: { type: String, required: true },
      targetUrl: { type: String, required: true },
      anchorText: { type: String, required: true },
      reasonCategory: {
        type: String,
        enum: ['orphan_rescue', 'hub_page_linking', 'topical_relevance'],
        default: 'topical_relevance'
      },
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Reuses the existing WorkspaceTask taskType enum's 'Internal Linking'
    // value (already present) — no schema change to that model needed.
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceInternalLinkSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceInternalLink', WorkspaceInternalLinkSchema, 'workspace_internal_links');
