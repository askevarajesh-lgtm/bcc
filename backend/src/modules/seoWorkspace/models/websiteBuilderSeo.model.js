const mongoose = require('mongoose');

/**
 * Website Builder SEO Agent's own persisted run output.
 *
 * Deliberately its OWN collection, scoped by `websiteId`/`pageId` — NOT a
 * `WorkspaceProject`-scoped collection like `WorkspaceTechnicalAudit`/
 * `WorkspaceImageSeo`/etc. Those agents analyze a *live, crawlable* domain
 * tracked as a `WorkspaceProject` (SEO Workspace). This agent analyzes a
 * Website Builder `Page` document directly — GrapesJS-authored pages that
 * are frequently still `Draft` and have never been crawled, and that have
 * no required/guaranteed corresponding `WorkspaceProject`. Forcing a
 * `projectId` ref to `WorkspaceProject` here (as `WorkspaceTask`/
 * `WorkspaceAuditLog` do) would mean fabricating an SEO Workspace project
 * for every website just to satisfy an unrelated schema — that's a hack,
 * not reuse, so this model intentionally does not depend on that
 * collection at all.
 *
 * Shape otherwise deliberately mirrors the sibling agents' `agent`
 * sub-schema (summary/items-array/approvalStatus/approvedBy/approvedAt/
 * rejectionReason) so this agent's approval-gate code reads the same as
 * every other agent in this module. `generatedTasks` is embedded (not a
 * ref to `WorkspaceTask`) for the same reason described above — this
 * agent's own execution history is fully self-contained on this
 * document, same "own execution history" requirement, just without the
 * WorkspaceProject dependency.
 */
const WebsiteBuilderSeoSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectPageSeoSignals) — kept
  // alongside the generated findings so a human reviewer can see exactly
  // what this run's suggestions were grounded in. No AI involved in this
  // phase; every field is either directly measured off `page.html`/
  // `page.customHeadCode` (via cheerio, same library `website.chrome.js`
  // already uses for header/footer parsing) or a plain deterministic
  // comparison against sibling pages on the same website.
  inputs: {
    path: { type: String, default: '' },
    pageTitle: { type: String, default: '' }, // Page.title (the builder's page name, not a <title> tag)
    currentTitleTag: { type: String, default: '' }, // <title> found in customHeadCode, if any
    currentMetaDescription: { type: String, default: '' },
    currentCanonical: { type: String, default: '' },
    h1Count: { type: Number, default: 0 },
    h1Texts: { type: [String], default: [] },
    headingSequence: { type: [String], default: [] }, // e.g. ['h1','h2','h2','h4'] in document order
    skippedHeadingLevel: { type: Boolean, default: false },
    wordCount: { type: Number, default: 0 },
    duplicateTitleOfPageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    duplicateMetaDescriptionOfPageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    // 'builder' — this agent only ever reads the stored Page document
    // (never fetches the live/published URL) — kept for parity with the
    // other agents' inputs.dataSource honesty convention, always 'builder'
    // here rather than 'crawl'/'internal-only'.
    dataSource: { type: String, enum: ['builder'], default: 'builder' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'website-builder-seo-agent'; data reference only
    summary: { type: String, default: null },
    findings: [{
      findingType: {
        type: String,
        enum: [
          'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
          'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description',
          'missing_h1', 'multiple_h1', 'skipped_heading_level', 'thin_content', 'missing_canonical'
        ],
        required: true
      },
      severity: { type: String, enum: ['high', 'medium', 'low'], required: true }, // deterministic, computed in Phase 1 — never AI-assigned
      currentValue: { type: String, default: '' },
      proposedValue: { type: String, default: '' }, // only populated for title/meta-description finding types
      rationale: { type: String, default: '' },
      isValid: { type: Boolean, default: true } // result of deterministic validation in Phase 2 — false means "manual review required", never silently dropped
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Embedded, self-contained tasks — see header note on why this isn't
    // a ref to `WorkspaceTask`.
    generatedTasks: [{
      taskType: {
        type: String,
        enum: ['Update Meta Tags', 'Fix Heading Structure', 'Add Canonical Tag', 'Expand Thin Content'],
        required: true
      },
      description: { type: String, required: true },
      proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
      status: { type: String, enum: ['Pending', 'Implemented'], default: 'Pending' }
    }]
  }
}, { timestamps: true });

WebsiteBuilderSeoSchema.index({ websiteId: 1, pageId: 1, createdAt: -1 });

module.exports = mongoose.model('WebsiteBuilderSeo', WebsiteBuilderSeoSchema, 'website_builder_seo');
