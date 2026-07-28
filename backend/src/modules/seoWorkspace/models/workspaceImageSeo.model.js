const mongoose = require('mongoose');

/**
 * Image SEO Agent's own persisted run output.
 *
 * A new collection, not a reuse of `WorkspaceTechnicalAudit`/
 * `WorkspaceSchemaMarkup`/`WorkspaceInternalLink` — same "own collection
 * per agent" precedent those establish (see `workspaceSchemaMarkup.model.js`'s
 * header): this run's shape is a list of per-image recommendations (alt
 * text + filename slug + loading/layout fixes) keyed by pageUrl+src, not a
 * page-type classification, a source->target link pair, or a findings list,
 * and folding it into one of those would silently corrupt other code's
 * assumptions about that collection's shape.
 *
 * Shape deliberately mirrors the other agents' `agent` sub-schema
 * (summary/items-array/approvalStatus/approvedBy/approvedAt/
 * rejectionReason/generatedTaskIds) so the approval-gate and
 * task-generation code in `imageSeoAgent.service.js` reads the same as
 * every other agent in this module.
 */
const WorkspaceImageSeoSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectImageSignals) — kept
  // alongside the generated recommendations so a human/agent can see
  // exactly what image data the AI's suggestions were grounded in. No AI
  // involved in this phase; every flag (missingAlt/genericAlt/
  // genericFilename/missingDimensions) is a deterministic, code-level
  // check, never AI-estimated.
  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      images: [{
        src: { type: String, required: true }, // absolute URL
        currentAlt: { type: String, default: '' },
        currentTitle: { type: String, default: '' },
        hasWidthHeight: { type: Boolean, default: false },
        loadingAttr: { type: String, default: '' }, // raw value of the loading="" attribute, if present
        isLikelyHero: { type: Boolean, default: false }, // first content image on the page — never lazy-load candidate
        filename: { type: String, default: '' }, // final path segment, decoded, query stripped
        // deterministic flags, computed in Phase 1 — the candidate set
        // Phase 2's prompt is restricted to
        missingAlt: { type: Boolean, default: false },
        genericAlt: { type: Boolean, default: false }, // alt equals/echoes the filename, or a generic word like "image"/"photo"
        genericFilename: { type: Boolean, default: false } // camera-default pattern, bare hash/number, spaces/parens
      }]
    }],
    // 'internal-only' when the light crawl pass failed or returned
    // nothing — never fabricated, mirrors the other agents' inputs
    // .dataSource honesty convention.
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'image-seo-agent'; data reference only
    summary: { type: String, default: null },
    images: [{
      // Must exactly match one of inputs.pages[].url / inputs.pages[].images[].src
      // — enforced in imageSeoAgent.service.js#generateImageSeoRecommendations,
      // same hallucination guard the other agents' analysis phases use.
      pageUrl: { type: String, required: true },
      src: { type: String, required: true },
      recommendationType: {
        type: String,
        enum: ['alt_text', 'filename_slug', 'missing_dimensions', 'lazy_loading'],
        required: true
      },
      currentValue: { type: String, default: '' },
      proposedValue: { type: String, default: '' },
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Uses the 'Image Optimization' value added to WorkspaceTask.taskType's
    // enum for exactly this agent — see that model's inline comment.
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceImageSeoSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceImageSeo', WorkspaceImageSeoSchema, 'workspace_image_seo');
