const mongoose = require('mongoose');

/**
 * Schema Agent's own persisted run output.
 *
 * A new collection, not a reuse of `WorkspaceTechnicalAudit` (whose
 * `agent.findings` shape is fixed to the technical-signal `category`/
 * `severity` enums and is already read by that agent's own approve/reject
 * flow) or `WorkspaceContentBrief` (shaped around content briefs, not
 * per-page JSON-LD payloads). Same "own collection per agent" precedent as
 * both of those — see `workspaceTechnicalAudit.model.js`'s header for the
 * full reasoning: folding a differently-shaped agent output into an
 * existing collection that other code already reads with assumptions
 * about its shape silently corrupts those reads rather than crashing them.
 *
 * Shape deliberately mirrors `WorkspaceTechnicalAudit`/`WorkspaceContentBrief`'s
 * `agent` sub-schema (summary/items-array/approvalStatus/approvedBy/
 * approvedAt/rejectionReason/generatedTaskIds) so the approval-gate and
 * task-generation code in `schemaAgent.service.js` reads the same as the
 * other agents in this module — consistency of pattern, not a shared
 * collection.
 */
const WorkspaceSchemaMarkupSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectPageSignals) — kept
  // alongside the generated schema so a human/agent can see exactly what
  // page data the AI's JSON-LD was grounded in. No AI involved in this
  // phase; a page is either reachable and parsed, or it isn't.
  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      wordCount: { type: Number, default: 0 },
      indexable: { type: Boolean, default: null }
    }],
    // 'internal-only' when the light crawl pass failed or returned
    // nothing — never fabricated, mirrors WorkspaceTechnicalAudit.signals
    // .dataSource / WorkspaceContentBrief.inputs.dataSource's honesty
    // convention.
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'schema-agent'; data reference only
    summary: { type: String, default: null },
    pages: [{
      pageUrl: { type: String, required: true },
      // Must exactly match one of inputs.pages[].url — enforced in
      // schemaAgent.service.js#generateSchemaMarkup, same hallucination
      // guard the other agents' analysis phases use.
      pageType: {
        type: String,
        enum: [
          'Article', 'BlogPosting', 'Product', 'FAQPage', 'HowTo',
          'BreadcrumbList', 'WebPage', 'CollectionPage', 'Organization',
          'LocalBusiness', 'WebSite', 'Other'
        ],
        default: 'WebPage'
      },
      schemaTypes: [{ type: String }], // e.g. ['BlogPosting', 'BreadcrumbList']
      // The exact JSON-LD payload (single node or an @graph array of
      // nodes) — this is what schemaAgent's Human Approval Gate approves
      // and what the generated WorkspaceTask's proposedChanges carries
      // forward for implementation.
      jsonLd: { type: mongoose.Schema.Types.Mixed, required: true },
      // Deterministic, code-level validation output — computed by
      // schemaAgent.service.js#validateSchemaMarkup, NOT by the AI call,
      // so a human reviewer isn't relying on the model's own self-grading
      // of its output. See that skill's "non-negotiable" validation step.
      validation: {
        isValid: { type: Boolean, default: false }, // true only if errors.length === 0
        errors: [{ type: String }], // missing-required-property / invalid-JSON findings
        warnings: [{ type: String }], // missing-recommended-property findings
        richResultEligibility: [{ type: String }] // human-readable, e.g. "BlogPosting: Article rich result"
      },
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Reuses the existing WorkspaceTask taskType enum's 'Schema Injection'
    // value — no schema change to that model needed.
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceSchemaMarkupSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceSchemaMarkup', WorkspaceSchemaMarkupSchema, 'workspace_schema_markup');
