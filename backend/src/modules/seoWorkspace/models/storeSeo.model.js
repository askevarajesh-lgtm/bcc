const mongoose = require('mongoose');

/**
 * Store SEO Agent's own persisted run output.
 *
 * Deliberately its OWN collection, scoped by `storeId` — NOT a
 * `WorkspaceProject`-scoped collection like `WorkspaceTechnicalAudit`/
 * `WorkspaceImageSeo`/`WorkspaceContentBrief`/etc. Same reasoning as
 * `websiteBuilderSeo.model.js` and `blogSeo.model.js`: this agent analyzes a
 * `Store` document directly (`modules/stores/store.model.js`) — a
 * storefront that is frequently still `Draft` status and has no
 * required/guaranteed corresponding `WorkspaceProject`. Forcing a
 * `projectId` ref to `WorkspaceProject` here would mean fabricating an SEO
 * Workspace project for every store just to satisfy an unrelated schema —
 * that's a hack, not reuse, so this model intentionally does not depend on
 * that collection at all. Same reason `storeSeoAgent.service.js` logs via
 * `aiCore/logger.service.js#info` rather than
 * `seoWorkspace/services/auditLog.service.js` (whose target model,
 * `WorkspaceAuditLog`, has `projectId: { ref: 'WorkspaceProject', required:
 * true }`).
 *
 * Shape otherwise deliberately mirrors `WebsiteBuilderSeo`/
 * `WorkspaceBlogSeo`'s `agent` sub-schema (summary/items-array/
 * approvalStatus/approvedBy/approvedAt/rejectionReason/embedded
 * generatedTasks) so this agent's approval-gate code reads the same as
 * every other agent in this module.
 */
const WorkspaceStoreSeoSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectStoreSeoSignals) — kept
  // alongside the generated findings so a human reviewer can see exactly
  // what this run's suggestions were grounded in. No AI involved in this
  // phase; every field is either directly read off `store.seoTitle`/
  // `store.seoDescription`/`store.ogImageUrl`/`store.faviconUrl`, or a
  // plain deterministic count against this store's own `Product` documents
  // (`modules/stores/product.model.js`) — never AI-guessed.
  inputs: {
    storeName: { type: String, default: '' },
    currentSeoTitle: { type: String, default: '' },
    currentSeoDescription: { type: String, default: '' },
    hasOgImage: { type: Boolean, default: false },
    hasFavicon: { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
    productsMissingImagesCount: { type: Number, default: 0 },
    // 'stored-content' — this agent only ever reads the stored Store/Product
    // documents (never fetches the live/published storefront URL) — kept
    // for parity with the other agents' inputs.dataSource honesty
    // convention.
    dataSource: { type: String, enum: ['stored-content'], default: 'stored-content' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'store-seo-agent'; data reference only
    summary: { type: String, default: null },
    findings: [{
      findingType: {
        type: String,
        enum: [
          'missing_seo_title', 'seo_title_too_short', 'seo_title_too_long',
          'missing_seo_description', 'seo_description_too_short', 'seo_description_too_long',
          'missing_og_image', 'missing_favicon', 'thin_catalog', 'products_missing_images'
        ],
        required: true
      },
      severity: { type: String, enum: ['high', 'medium', 'low'], required: true }, // deterministic, computed in Phase 1 — never AI-assigned
      currentValue: { type: String, default: '' },
      proposedValue: { type: String, default: '' }, // only populated for seoTitle/seoDescription finding types
      rationale: { type: String, default: '' },
      isValid: { type: Boolean, default: true } // result of deterministic validation in Phase 2 — false means "manual review required", never silently dropped
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Embedded, self-contained tasks — same reasoning as
    // WebsiteBuilderSeo.agent.generatedTasks / WorkspaceBlogSeo.agent.generatedTasks:
    // no WorkspaceTask dependency.
    generatedTasks: [{
      taskType: {
        type: String,
        enum: ['Update Store SEO Metadata', 'Add Social Share Image', 'Add Favicon', 'Expand Product Catalog', 'Add Product Images'],
        required: true
      },
      description: { type: String, required: true },
      proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
      status: { type: String, enum: ['Pending', 'Implemented'], default: 'Pending' }
    }]
  }
}, { timestamps: true });

WorkspaceStoreSeoSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceStoreSeo', WorkspaceStoreSeoSchema, 'workspace_store_seo');
