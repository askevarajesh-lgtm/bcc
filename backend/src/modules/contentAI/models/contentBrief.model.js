const mongoose = require('mongoose');

const ContentBriefSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentPiece', index: true },
  
  targetAudience: { type: String, default: '' },
  searchIntent: { 
    type: String, 
    enum: ['Informational', 'Navigational', 'Commercial', 'Transactional', 'Mixed', ''],
    default: '' 
  },
  
  keywords: {
    primary: { type: String, required: true },
    secondary: [{ type: String }],
    longTail: [{ type: String }]
  },

  entities: {
    required: [{ type: String }],
    recommended: [{ type: String }]
  },

  structure: {
    recommendedWordCount: { type: Number, default: 0 },
    headings: [{
      level: { type: String, enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
      text: { type: String },
      keywords: [{ type: String }]
    }]
  },

  competitorInsights: {
    averageWordCount: { type: Number, default: 0 },
    missingTopics: [{ type: String }],
    topRankingUrls: [{ type: String }]
  },

  links: {
    internal: [{ url: String, anchorText: String }],
    external: [{ url: String, anchorText: String }]
  },

  tone: { type: String, default: 'Professional' },
  questionsToAnswer: [{ type: String }],
  ctaRecommendations: [{ type: String }],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ContentBrief', ContentBriefSchema);
