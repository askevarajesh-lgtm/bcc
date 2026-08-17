const mongoose = require('mongoose');

const options = { discriminatorKey: 'entityType', collection: 'workspace_aeo_audit_entities', timestamps: true };

const WorkspaceAeoAuditEntitySchema = new mongoose.Schema({}, options);

// Shared base indexes
WorkspaceAeoAuditEntitySchema.index({ auditId: 1 }, { sparse: true });
WorkspaceAeoAuditEntitySchema.index({ projectId: 1 }, { sparse: true });

const WorkspaceAeoAuditEntity = mongoose.model('WorkspaceAeoAuditEntity', WorkspaceAeoAuditEntitySchema);

// 1. AEO Audit Model
const WorkspaceAeoAudit = WorkspaceAeoAuditEntity.discriminator('WorkspaceAeoAudit', new mongoose.Schema({
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
  executionTime: { type: Number, default: 0 }, 

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
    agentKey: { type: String, default: null }, 
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
}), 'audit');

WorkspaceAeoAuditEntitySchema.index({ projectId: 1, createdAt: -1 }, { sparse: true });


// 2. AEO Audit Page Model
const WorkspaceAeoAuditPage = WorkspaceAeoAuditEntity.discriminator('WorkspaceAeoAuditPage', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAuditEntity', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  pageUrl: { type: String, required: true },
  
  status: { type: String, enum: ['pending', 'queued', 'running', 'completed', 'failed'], default: 'pending' },
  error: { type: String, default: null },

  pageScores: {
    readinessScore: { type: Number, min: 0, max: 100, default: null },
    contentQuality: { type: Number, min: 0, max: 100, default: null },
    readability: { type: Number, min: 0, max: 100, default: null }
  },

  schemaValidation: {
    valid: { type: Boolean, default: null },
    issues: [{
      type: { type: String },
      severity: { type: String, enum: ['error', 'warning', 'info'] },
      message: { type: String }
    }]
  },

  completedAt: { type: Date, default: null }
}), 'page');

// Use a partial filter instead of {unique: true} alone, as multiple assetTypes will be in the same collection
WorkspaceAeoAuditEntitySchema.index({ entityType: 1, auditId: 1, pageUrl: 1 }, { unique: true, partialFilterExpression: { entityType: 'page' } });
WorkspaceAeoAuditEntitySchema.index({ projectId: 1, status: 1 }, { sparse: true });


// 3. AEO Audit Recommendation Model
const WorkspaceAeoAuditRecommendation = WorkspaceAeoAuditEntity.discriminator('WorkspaceAeoAuditRecommendation', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAuditEntity', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  category: { 
    type: String, 
    enum: ['Technical', 'Content', 'Schema', 'Metadata', 'Internal Linking', 'Entities', 'EEAT'],
    required: true
  },
  
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  impact: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  difficulty: { type: String, enum: ['Hard', 'Medium', 'Easy'], required: true },
  
  estimatedEffort: { type: String, default: '' },
  
  affectedPage: { type: String, default: null }, 
  suggestedFix: { type: String, required: true },
  reference: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Task Created', 'In Progress', 'Completed', 'Ignored', 'Archived'], 
    default: 'Pending' 
  },
  
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask', default: null }
}), 'recommendation');

WorkspaceAeoAuditEntitySchema.index({ auditId: 1, category: 1 }, { sparse: true });


// 4. AEO Audit Entity Graph Model
const WorkspaceAeoAuditEntityGraph = WorkspaceAeoAuditEntity.discriminator('WorkspaceAeoAuditEntityGraph', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAuditEntity', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  pageUrl: { type: String, required: true },

  nodes: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Organization', 'Person', 'Product', 'Service', 'Brand', 'Location', 'Technology', 'Event', 'Topic', 'Other'],
      default: 'Other'
    },
    confidence: { type: Number, min: 0, max: 100, default: null }
  }],
  
  edges: [{
    source: { type: String, required: true }, 
    target: { type: String, required: true }, 
    relationship: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, default: null }
  }]
}), 'entityGraph');

WorkspaceAeoAuditEntitySchema.index({ entityType: 1, auditId: 1, pageUrl: 1 }, { unique: true, partialFilterExpression: { entityType: 'entityGraph' } });


// 5. AEO Audit Simulation Model
const WorkspaceAeoAuditSimulation = WorkspaceAeoAuditEntity.discriminator('WorkspaceAeoAuditSimulation', new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAuditEntity', required: true, index: true },
  pageUrl: { type: String, required: true },
  
  platform: { 
    type: String, 
    enum: ['ChatGPT', 'Google AI Overviews', 'Gemini', 'Perplexity', 'Copilot'],
    required: true
  },
  
  citationLikelihood: { type: Number, min: 0, max: 100, default: null }, 
  confidenceScore: { type: Number, min: 0, max: 100, default: null },
  
  simulation: {
    bestCandidateParagraph: { type: String, default: '' },
    missingInformation: [{ type: String }],
    reasons: [{ type: String }],
    suggestedImprovements: [{ type: String }]
  }
}), 'simulation');

WorkspaceAeoAuditEntitySchema.index({ entityType: 1, auditId: 1, pageUrl: 1, platform: 1 }, { unique: true, partialFilterExpression: { entityType: 'simulation' } });


module.exports = {
  WorkspaceAeoAuditEntity,
  WorkspaceAeoAudit,
  WorkspaceAeoAuditPage,
  WorkspaceAeoAuditRecommendation,
  WorkspaceAeoAuditEntityGraph,
  WorkspaceAeoAuditSimulation
};
