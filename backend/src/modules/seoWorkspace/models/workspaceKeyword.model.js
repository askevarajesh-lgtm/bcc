const mongoose = require('mongoose');

const WorkspaceKeywordSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  keyword: { type: String, required: true, trim: true },
  locationCode: { type: Number, default: 2840 }, // Default US
  languageCode: { type: String, default: 'en' },
  
  // DataForSEO specific identifiers (to avoid duplicate tracking tasks)
  taskId: { type: String, default: null },

  // Latest Metrics (Cached for fast retrieval)
  metrics: {
    searchVolume: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    competition: { type: Number, default: 0 }, // 0 to 1
    keywordDifficulty: { type: Number, default: 0 }, // 0 to 100
    intent: { type: String, enum: ['informational', 'navigational', 'commercial', 'transactional', 'local', 'branded', 'unknown'], default: 'unknown' },
    trends: [{ type: Number }], // 12 months search volume trend
    serpFeatures: [{ type: String }] // e.g., 'featured_snippet', 'people_also_ask'
  },

  // Ranking data
  ranking: {
    currentRank: { type: Number, default: null },
    previousRank: { type: Number, default: null },
    bestRank: { type: Number, default: null },
    url: { type: String, default: null }, // URL that is ranking
    isFeaturedSnippet: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['FOUND', 'NOT_FOUND_TOP100', 'PROVIDER_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'CRAWL_ERROR', 'UNKNOWN'], 
      default: 'UNKNOWN' 
    },
    history: [{
      date: { type: Date },
      rank: { type: Number } // Can be null if status was NOT_FOUND_TOP100 or ERROR
    }]
  },

  // Cannibalization Detection
  cannibalization: {
    isCannibalized: { type: Boolean, default: false },
    conflictUrls: [{ type: String }],
    severity: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'none' }
  },

  // Clustering and NLP
  cluster: { type: String, default: null },
  parentKeyword: { type: String, default: null },
  clusterConfidence: { type: Number, default: null },
  topicId: { type: String, default: null },
  entities: [{ type: String }], // NLP extracted entities
  
  intentConfidence: { type: Number, default: null },
  intentReason: { type: String, default: null },

  // Discovery mapping (Which URLs contain this keyword)
  pageUrls: [{
    url: { type: String },
    htmlElement: { type: String }, // e.g. H1, Title, Meta
    frequency: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  }],

  // Tags for organizing keywords
  tags: [{ type: String }],

  isQuestion: { type: Boolean, default: false },

  isDeleted: { type: Boolean, default: false },

  // Source and Lifecycle
  source: { type: String, enum: ['manual', 'ranked-import', 'keyword-research-agent', 'discovery_crawler'], default: 'manual' },
  status: { type: String, enum: ['Suggested', 'Approved', 'Rejected'], default: 'Approved' },
  lifecycle: { 
    type: String, 
    enum: ['Discovered', 'Suggested', 'Approved', 'Tracked', 'Ranking', 'Growing', 'Declining', 'Archived'], 
    default: 'Discovered' 
  },

  // Agent, Quality, Authority
  qualityScore: { type: Number, default: null }, // 0-100
  qualityReason: { type: String, default: null },
  authorityScore: { type: Number, default: null }, // 0-100
  
  agent: {
    agentKey: { type: String, default: null },
    opportunityScore: { type: Number, default: null }, // 0-100
    opportunityBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} }, // Why the score is what it is
    rationale: { type: String, default: null },
    theme: { type: String, default: null } 
  },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
}, { timestamps: true });

// Ensure unique keywords per project
WorkspaceKeywordSchema.index({ projectId: 1, keyword: 1, locationCode: 1, languageCode: 1 }, { unique: true });

// Fast queries for dashboard
WorkspaceKeywordSchema.index({ projectId: 1, 'ranking.currentRank': 1 });
WorkspaceKeywordSchema.index({ projectId: 1, lifecycle: 1 });
WorkspaceKeywordSchema.index({ projectId: 1, cluster: 1 });

module.exports = mongoose.model('WorkspaceKeyword', WorkspaceKeywordSchema, 'workspace_keywords');