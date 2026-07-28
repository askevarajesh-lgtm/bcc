const mongoose = require('mongoose');
const WorkspaceAeoAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  inputs: {
    pages: [{
      url: { type: String },
      title: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      h1: { type: String, default: '' },
      headings: [{ level: { type: Number }, text: { type: String } }],
      wordCount: { type: Number, default: 0 },
      listCount: { type: Number, default: 0 },
      tableCount: { type: Number, default: 0 },
      hasExistingFaqSchema: { type: Boolean, default: false },
      indexable: { type: Boolean, default: null }
    }],
    dataSource: { type: String, enum: ['crawl', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'aeo-agent'; data reference only
    summary: { type: String, default: null },
    pages: [{
      pageUrl: { type: String, required: true }, 
      aeoReadinessScore: { type: Number, min: 0, max: 100, default: null },
      directAnswerSuggestion: { type: String, default: '' }, // 40-60 word grounded direct-answer snippet
      suggestedFaqBlock: [{ question: { type: String }, answer: { type: String } }],
      missingElements: [{ type: String }], // e.g. "no question-format subheadings", "no byline/entity statement"
      rationale: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceAeoAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceAeoAudit', WorkspaceAeoAuditSchema, 'workspace_aeo_audits');
