const mongoose = require('mongoose');

const OptimizationScoreSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true, default: null },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true, default: null },
  domain: { type: String, required: true, trim: true, index: true },

  overallScore: { type: Number, default: 0 },
  seoScore: { type: Number, default: 0 },
  geoScore: { type: Number, default: 0 },
  aeoScore: { type: Number, default: 0 },

  // Detailed Metrics
  seoMetrics: {
    authorityScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    contentScore: { type: Number, default: 0 },
    organicTraffic: { type: Number, default: 0 },
    backlinks: { type: Number, default: 0 },
    coreWebVitals: { type: Number, default: 0 },
    schemaScore: { type: Number, default: 0 }
  },

  geoMetrics: {
    websiteAuthority: { type: Number, default: 0 },
    topicalAuthority: { type: Number, default: 0 },
    keywordCoverage: { type: Number, default: 0 },
    semanticCoverage: { type: Number, default: 0 },
    entityCoverage: { type: Number, default: 0 },
    contentFreshness: { type: Number, default: 0 },
    eeatSignals: { type: Number, default: 0 },
    aiReadability: { type: Number, default: 0 },
    llmFormatting: { type: Number, default: 0 },
    historicalGrowth: { type: Number, default: 0 },
    aiVisibilityPrediction: { type: Number, default: 0 }
  },

  aeoMetrics: {
    faqSchema: { type: Number, default: 0 },
    qAndACoverage: { type: Number, default: 0 },
    answerIntent: { type: Number, default: 0 },
    snippetOptimization: { type: Number, default: 0 },
    voiceSearchScore: { type: Number, default: 0 },
    conversationalContent: { type: Number, default: 0 },
    semanticQuestions: { type: Number, default: 0 },
    answerAccuracy: { type: Number, default: 0 }
  },

  // AI Generated Issues and Recommendations
  issues: [{
    category: { type: String, enum: ['SEO', 'GEO', 'AEO', 'Technical', 'Content', 'Schema'] },
    priority: { type: String, enum: ['High', 'Medium', 'Low'] },
    title: { type: String },
    description: { type: String },
    impact: { type: String }
  }],
  
  recommendations: [{
    category: { type: String, enum: ['SEO', 'GEO', 'AEO'] },
    title: { type: String },
    description: { type: String },
    type: { type: String, default: 'Other' },
    status: { type: String, enum: ['Pending', 'Completed', 'Ignored'], default: 'Pending' }
  }],

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

OptimizationScoreSchema.index({ domain: 1, companyId: 1, clientId: 1, createdAt: -1 });

module.exports = mongoose.model('OptimizationScore', OptimizationScoreSchema);
