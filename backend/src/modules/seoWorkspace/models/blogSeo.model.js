const mongoose = require('mongoose');

/**
 * Blog SEO Agent's own persisted run output.
 *
 * Deliberately its OWN collection, scoped by `blogId`/`postId` — NOT a
 * `WorkspaceProject`-scoped collection like `WorkspaceTechnicalAudit`/
 * `WorkspaceImageSeo`/`WorkspaceContentBrief`/etc. Same reasoning as
 * `websiteBuilderSeo.model.js`: this agent analyzes a `BlogPost` document
 * directly (`modules/blogs/blog-post.model.js`) — a post that is frequently
 * still `draft` status, has no required/guaranteed corresponding
 * `WorkspaceProject`, and is addressed by `blogId`/`postId`, not a crawlable
 * domain. Forcing a `projectId` ref to `WorkspaceProject` here (as
 * `WorkspaceAuditLog`/`WorkspaceTask` require) would mean fabricating an SEO
 * Workspace project for every blog just to satisfy an unrelated schema —
 * that's a hack, not reuse, so this model intentionally does not depend on
 * that collection at all. This is why `blogSeoAgent.service.js` logs via
 * `aiCore/logger.service.js#info` rather than
 * `seoWorkspace/services/auditLog.service.js` (whose target model,
 * `WorkspaceAuditLog`, has `projectId: { ref: 'WorkspaceProject', required:
 * true }` — see that model's header) — same choice
 * `websiteBuilderSeoAgent.service.js` already made for the same reason.
 *
 * Shape otherwise deliberately mirrors `WebsiteBuilderSeo`'s `agent`
 * sub-schema (summary/items-array/approvalStatus/approvedBy/approvedAt/
 * rejectionReason/embedded generatedTasks) so this agent's approval-gate
 * code reads the same as every other agent in this module.
 */
const WorkspaceBlogSeoSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  // Objective inputs collected in Phase 1 (collectBlogPostSeoSignals) — kept
  // alongside the generated findings so a human reviewer can see exactly
  // what this run's suggestions were grounded in. No AI involved in this
  // phase; every field is either directly measured off `post.html`/
  // `post.metaTitle`/`post.metaDescription`/`post.excerpt` (via cheerio,
  // same library `websiteBuilderSeoAgent.service.js` and
  // `websites/website.chrome.js` already use for markup parsing) or a plain
  // deterministic comparison against sibling posts in the same blog.
  inputs: {
    slug: { type: String, default: '' },
    postTitle: { type: String, default: '' }, // BlogPost.title, not the <title>/metaTitle SEO field
    currentMetaTitle: { type: String, default: '' },
    currentMetaDescription: { type: String, default: '' },
    currentExcerpt: { type: String, default: '' },
    h1Count: { type: Number, default: 0 },
    h1Texts: { type: [String], default: [] },
    headingSequence: { type: [String], default: [] }, // e.g. ['h1','h2','h2','h4'] in document order
    skippedHeadingLevel: { type: Boolean, default: false },
    wordCount: { type: Number, default: 0 },
    duplicateMetaTitleOfPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', default: null },
    duplicateMetaDescriptionOfPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', default: null },
    // 'stored-content' — this agent only ever reads the stored BlogPost
    // document (never fetches the live/published blog URL) — kept for
    // parity with the other agents' inputs.dataSource honesty convention.
    dataSource: { type: String, enum: ['stored-content'], default: 'stored-content' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'blog-seo-agent'; data reference only
    summary: { type: String, default: null },
    findings: [{
      findingType: {
        type: String,
        enum: [
          'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
          'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description',
          'missing_h1', 'multiple_h1', 'skipped_heading_level', 'thin_content', 'missing_excerpt'
        ],
        required: true
      },
      severity: { type: String, enum: ['high', 'medium', 'low'], required: true }, // deterministic, computed in Phase 1 — never AI-assigned
      currentValue: { type: String, default: '' },
      proposedValue: { type: String, default: '' }, // only populated for title/meta-description/excerpt finding types
      rationale: { type: String, default: '' },
      isValid: { type: Boolean, default: true } // result of deterministic validation in Phase 2 — false means "manual review required", never silently dropped
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    // Embedded, self-contained tasks — same reasoning as
    // WebsiteBuilderSeo.agent.generatedTasks: no WorkspaceTask dependency.
    generatedTasks: [{
      taskType: {
        type: String,
        enum: ['Update Meta Tags', 'Fix Heading Structure', 'Expand Thin Content', 'Add Excerpt'],
        required: true
      },
      description: { type: String, required: true },
      proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
      status: { type: String, enum: ['Pending', 'Implemented'], default: 'Pending' }
    }]
  }
}, { timestamps: true });

WorkspaceBlogSeoSchema.index({ blogId: 1, postId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceBlogSeo', WorkspaceBlogSeoSchema, 'workspace_blog_seo');
