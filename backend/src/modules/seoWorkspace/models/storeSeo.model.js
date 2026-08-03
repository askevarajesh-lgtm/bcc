const mongoose = require('mongoose');
const WorkspaceStoreSeoSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  inputs: {
    storeName: { type: String, default: '' },
    currentSeoTitle: { type: String, default: '' },
    currentSeoDescription: { type: String, default: '' },
    hasOgImage: { type: Boolean, default: false },
    hasFavicon: { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
    productsMissingImagesCount: { type: Number, default: 0 },
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
