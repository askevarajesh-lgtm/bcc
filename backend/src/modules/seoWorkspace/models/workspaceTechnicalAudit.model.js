const mongoose = require('mongoose');

/**
 * Technical SEO Agent's own persisted run output.
 *
 * Why a new collection instead of reusing `workspaceAudit.model.js`
 * (`WorkspaceAudit`), even though that schema is generic enough (free-text
 * `findings.category`, an `agent.agentKey` reference field) to technically
 * hold this agent's output too:
 *
 *   - `workspaceAgentOrchestrator.service.js` does
 *     `WorkspaceAudit.findOne({ projectId }).sort({ createdAt: -1 })` with no
 *     agentKey filter, and reads `audit.metrics.pagesCrawled` /
 *     `audit.metrics.onPage` straight off whatever it gets back.
 *   - `workspaceCron.service.js`'s scheduled-report diff takes the latest 2
 *     `WorkspaceAudit` docs for a project and diffs `metrics.performance` /
 *     `onPage` / `crawlability` / `overall` between them, assuming both are
 *     seo-auditor runs of the same shape and cadence.
 *   - `seoWorkspace.controller.js#getAudits` lists every `WorkspaceAudit` for
 *     a project for the existing frontend Audits view.
 *
 * Interleaving Technical SEO Agent runs into that same collection wouldn't
 * crash any of the above (the schema would accept it), but it would silently
 * corrupt them: a "latest audit" could be a technical-only run with no
 * `onPage`/content metrics, the scheduled-report diff would compare a
 * technical run against a content run instead of like-for-like, and the
 * existing Audits UI would render a document shape it wasn't built for. That
 * is exactly the kind of break rule 6 (never break existing functionality)
 * rules out — so this agent gets its own collection, the same call made for
 * `WorkspaceCompetitor` when no existing model fit at all. Here the model
 * would technically "fit"; the read-side blast radius is why it's still
 * kept separate.
 *
 * Shape deliberately mirrors `WorkspaceAudit`'s `agent` sub-schema
 * (summary/findings/approvalStatus/approvedBy/approvedAt/rejectionReason/
 * generatedTaskIds) so the approval-gate and task-generation code in
 * `technicalSeoAgent.service.js` reads the same as the other three agents —
 * consistency of pattern, without sharing the collection.
 */
const WorkspaceTechnicalAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective signals collected in Phase 1 (collectTechnicalSignals) — kept
  // alongside the analyzed findings so a human/agent can see exactly what
  // raw data the AI's findings were grounded in.
  signals: {
    robotsTxt: {
      exists: { type: Boolean, default: false },
      accessible: { type: Boolean, default: false },
      disallowsAll: { type: Boolean, default: false },
      declaresSitemap: { type: Boolean, default: false }
    },
    sitemap: {
      exists: { type: Boolean, default: false },
      urlCount: { type: Number, default: 0 }
    },
    ssl: {
      isHttps: { type: Boolean, default: false }
    },
    crawl: {
      pagesCrawled: { type: Number, default: 0 },
      redirectedPages: { type: Number, default: 0 },
      noindexPages: { type: Number, default: 0 },
      clientErrors4xx: { type: Number, default: 0 },
      serverErrors5xx: { type: Number, default: 0 },
      canonicalMissing: { type: Number, default: 0 },
      canonicalCrossDomain: { type: Number, default: 0 }
    },
    coreWebVitals: {
      // null when no page-speed provider is configured — never fabricated
      desktop: { type: mongoose.Schema.Types.Mixed, default: null },
      mobile: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    hreflang: {
      checked: { type: Boolean, default: false }, // only true when project.languages.length > 1
      tagsFound: { type: Number, default: 0 }
    },
    dataSource: { type: String, enum: ['dataforseo', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'technical-seo-agent'; data reference only
    summary: { type: String, default: null },
    findings: [{
      category: {
        type: String,
        enum: [
          'robots_txt', 'sitemap', 'ssl_https', 'canonical_issues',
          'redirect_chains', 'indexability', 'core_web_vitals',
          'mobile_usability', 'structured_data', 'hreflang', 'other'
        ],
        required: true
      },
      severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
      issue: { type: String, required: true },
      recommendation: { type: String, default: '' },
      // Reuses the exact taskType enum WorkspaceTask already validates
      // against — no schema change to that model needed.
      taskType: { type: String, enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking'], default: 'Content Edit' },
      pageUrl: { type: String, default: null }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceTechnicalAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceTechnicalAudit', WorkspaceTechnicalAuditSchema, 'workspace_technical_audits');
