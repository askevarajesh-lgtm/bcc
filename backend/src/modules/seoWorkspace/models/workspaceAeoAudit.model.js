const mongoose = require('mongoose');
const WorkspaceAeoAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { 
    type: String, 
    enum: [
      'pending', 'queued', 'running', 'in_progress', 
      'completed', 'completed_with_warnings', 'failed', 'cancelled'
    ], 
    default: 'pending' 
  },

  progress: { type: Number, default: 0 },

  // New fields for normalized architecture (Phase 1)
  summary: { type: String, default: null },
  overallScores: {
    aeo: { type: Number, default: null },
    citation: { type: Number, default: null },
    eeat: { type: Number, default: null },
    platforms: {
      chatgpt: { type: Number, default: null },
      googleAiOverviews: { type: Number, default: null },
      gemini: { type: Number, default: null },
      perplexity: { type: Number, default: null },
      copilot: { type: Number, default: null }
    }
  },
  executionTime: { type: Number, default: 0 }, // in milliseconds

  // Legacy fields (kept for backward compatibility)
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
      pageUrl: { type: String }, 
      aeoReadinessScore: { type: Number, min: 0, max: 100, default: null },
      directAnswerSuggestion: { type: String, default: '' }, 
      suggestedFaqBlock: [{ question: { type: String }, answer: { type: String } }],
      missingElements: [{ type: String }],
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
