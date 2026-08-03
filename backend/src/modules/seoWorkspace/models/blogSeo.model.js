const mongoose = require('mongoose');

const WorkspaceBlogSeoSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

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
