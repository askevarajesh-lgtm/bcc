const mongoose = require('mongoose');

const WorkspaceReportSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', default: null }, 
  
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive', 'executive_summary'], required: true },
  
  content: { type: String }, 
  
  format: { type: String, enum: ['pdf', 'excel', 'csv', 'markdown'], default: 'pdf' },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'queued', 'running', 'collecting_metrics', 'generating_ai', 'building_charts', 'exporting'], default: 'pending' },
  reportStatus: { type: String, enum: ['Draft', 'Queued', 'Running', 'Collecting Metrics', 'Generating AI', 'Building Charts', 'Exporting', 'Completed', 'Failed', 'Under Review', 'Approved', 'Rejected', 'Archived', 'Deleted'], default: 'Draft' },
  downloadUrl: { type: String, default: null },
  
  isScheduled: { type: Boolean, default: false },
  scheduleFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  emailRecipients: [{ type: String }],
  lastRunAt: { type: Date, default: null },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  source: { type: String, enum: ['manual', 'reporting-agent'], default: 'manual' },
  agent: {
    agentKey: { type: String, default: null }, 
    dataSources: [{ type: String }], 
    summary: { type: String, default: null },
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }
  },

  // --- Enterprise Extensions (Additive Only) ---
  reportTemplate: { type: String, default: 'default' },
  schemaVersion: { type: String, default: '1.0' },
  reportVersion: { type: Number, default: 1 },
  generatorVersion: { type: String, default: '1.0' },
  
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  generatedAt: { type: Date, default: null },
  comparedAudits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAudit' }],
  comparedDateRange: { 
    startDate: { type: Date }, 
    endDate: { type: Date } 
  },

  // Document References (Split Architecture)
  snapshot: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportSnapshot' },
  metrics: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportMetrics' },
  execution: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReportExecution' },
  
  // Storage & Caching
  storageVersion: { type: String, default: '1.0' },
  reportChecksum: { type: String },
  reportSize: { type: Number },
  
  // Analytics
  lastViewed: { type: Date },
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },

  // History & Soft Deletes
  archivedAt: { type: Date },
  deletedAt: { type: Date },
  scheduleHistory: [{ type: Object }], // For lightweight scheduling events

  // New Structured Sections (if they remain in the main document, they are small enough)
  executiveSummary: { type: String },
  reportSummary: { type: String },
  recommendations: [{ type: String }],
  quickWins: [{ type: String }],
  biggestImprovements: [{ type: String }],
  biggestRegressions: [{ type: String }],
  criticalIssues: [{ type: String }],
  actionPlan: { type: String },
  chartDefinitions: { type: Object }, // Declarative configs for frontend
}, { timestamps: true });

WorkspaceReportSchema.index({ agencyId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceReport', WorkspaceReportSchema, 'workspace_reports');