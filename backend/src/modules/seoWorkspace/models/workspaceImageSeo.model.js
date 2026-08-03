const mongoose = require('mongoose');
const WorkspaceImageSeoSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

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
        filename: { type: String, default: '' }, 
        missingAlt: { type: Boolean, default: false },
        genericAlt: { type: Boolean, default: false }, // alt equals/echoes the filename, or a generic word like "image"/"photo"
        genericFilename: { type: Boolean, default: false } // camera-default pattern, bare hash/number, spaces/parens
      }]
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'image-seo-agent'; data reference only
    summary: { type: String, default: null },
    images: [{
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
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceImageSeoSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceImageSeo', WorkspaceImageSeoSchema, 'workspace_image_seo');
