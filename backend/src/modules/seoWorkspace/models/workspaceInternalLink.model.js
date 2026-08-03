const mongoose = require('mongoose');
const WorkspaceInternalLinkSchema = new mongoose.Schema({
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
      indexable: { type: Boolean, default: null },
      outboundInternalLinks: [{ type: String }], // same-host links this page points to, within the crawled set
      inboundLinkCount: { type: Number, default: 0 }, // how many other crawled pages link to this one
      isOrphan: { type: Boolean, default: false } // inboundLinkCount === 0 and not the homepage
    }],
    existingLinks: [{
      sourceUrl: { type: String },
      targetUrl: { type: String }
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'internal-linking-agent'; data reference only
    summary: { type: String, default: null },
    suggestions: [{
      sourceUrl: { type: String, required: true },
      targetUrl: { type: String, required: true },
      anchorText: { type: String, required: true },
      reasonCategory: {
        type: String,
        enum: ['orphan_rescue', 'hub_page_linking', 'topical_relevance'],
        default: 'topical_relevance'
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

WorkspaceInternalLinkSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceInternalLink', WorkspaceInternalLinkSchema, 'workspace_internal_links');
