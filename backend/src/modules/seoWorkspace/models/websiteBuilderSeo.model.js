const mongoose = require('mongoose');
const WebsiteBuilderSeoSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

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
