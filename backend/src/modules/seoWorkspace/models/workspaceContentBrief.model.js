const mongoose = require('mongoose');
const WorkspaceContentBriefSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  inputs: {
    candidateKeywords: [{
      keyword: { type: String },
      searchVolume: { type: Number, default: 0 },
      keywordDifficulty: { type: Number, default: 0 },
      intent: { type: String, default: 'unknown' }
    }],
    existingPages: [{
      url: { type: String },
      title: { type: String }
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'content-agent'; data reference only
    summary: { type: String, default: null },
    briefs: [{
      title: { type: String, required: true },
      contentType: {
        type: String,
        enum: ['blog_post', 'landing_page', 'pillar_page', 'product_page'],
        default: 'blog_post'
      },
      targetKeyword: { type: String, required: true },
      secondaryKeywords: [{ type: String }],
      recommendedAction: { type: String, enum: ['new_page', 'update_existing'], default: 'new_page' },
      targetUrl: { type: String, default: null },
      outline: [{ type: String }],
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      wordCountTarget: { type: Number, default: null },
      theme: { type: String, default: 'general' }, // cluster label; used to detect repeated rejections
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceContentBriefSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceContentBrief', WorkspaceContentBriefSchema, 'workspace_content_briefs');
