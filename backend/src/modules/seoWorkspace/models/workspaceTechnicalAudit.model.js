const mongoose = require('mongoose');
const WorkspaceTechnicalAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },

  signals: {
    robotsTxt: {
      exists: { type: Boolean, default: false },
      accessible: { type: Boolean, default: false },
      disallowsAll: { type: Boolean, default: false },
      declaresSitemap: { type: Boolean, default: false }
    },
    sitemap: {
      exists: { type: Boolean, default: false },
      urlCount: { type: Number, default: 0 }
    },
    ssl: {
      isHttps: { type: Boolean, default: false }
    },
    crawl: {
      pagesCrawled: { type: Number, default: 0 },
      redirectedPages: { type: Number, default: 0 },
      noindexPages: { type: Number, default: 0 },
      clientErrors4xx: { type: Number, default: 0 },
      serverErrors5xx: { type: Number, default: 0 },
      canonicalMissing: { type: Number, default: 0 },
      canonicalCrossDomain: { type: Number, default: 0 }
    },
    coreWebVitals: {
      desktop: { type: mongoose.Schema.Types.Mixed, default: null },
      mobile: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    hreflang: {
      checked: { type: Boolean, default: false }, // only true when project.languages.length > 1
      tagsFound: { type: Number, default: 0 }
    },
    dataSource: { type: String, enum: ['dataforseo', 'internal-only'], default: 'internal-only' }
  },

  completedAt: { type: Date, default: null },

  agent: {
    agentKey: { type: String, default: null }, // 'technical-seo-agent'; data reference only
    summary: { type: String, default: null },
    findings: [{
      category: {
        type: String,
        enum: [
          'robots_txt', 'sitemap', 'ssl_https', 'canonical_issues',
          'redirect_chains', 'indexability', 'core_web_vitals',
          'mobile_usability', 'structured_data', 'hreflang', 'other'
        ],
        required: true
      },
      severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
      issue: { type: String, required: true },
      recommendation: { type: String, default: '' },
      taskType: { type: String, enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking'], default: 'Content Edit' },
      pageUrl: { type: String, default: null }
    }],
    approvalStatus: { type: String, enum: ['Not Requested', 'Pending Approval', 'Approved', 'Rejected'], default: 'Not Requested' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    generatedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' }]
  }
}, { timestamps: true });

WorkspaceTechnicalAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceTechnicalAudit', WorkspaceTechnicalAuditSchema, 'workspace_technical_audits');
