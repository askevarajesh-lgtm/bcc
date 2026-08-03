const mongoose = require('mongoose');
const WorkspaceSchemaMarkupSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      wordCount: { type: Number, default: 0 },
      indexable: { type: Boolean, default: null }
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'schema-agent'; data reference only
    summary: { type: String, default: null },
    pages: [{
      pageUrl: { type: String, required: true },
      pageType: {
        type: String,
        enum: [
          'Article', 'BlogPosting', 'Product', 'FAQPage', 'HowTo',
          'BreadcrumbList', 'WebPage', 'CollectionPage', 'Organization',
          'LocalBusiness', 'WebSite', 'Other'
        ],
        default: 'WebPage'
      },
      schemaTypes: [{ type: String }],
      jsonLd: { type: mongoose.Schema.Types.Mixed, required: true },
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
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceSchemaMarkupSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceSchemaMarkup', WorkspaceSchemaMarkupSchema, 'workspace_schema_markup');
