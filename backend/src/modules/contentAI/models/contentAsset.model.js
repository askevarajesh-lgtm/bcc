const mongoose = require('mongoose');
const { GENERATOR_KEYS } = require('../generators/registry');

const options = { discriminatorKey: 'assetType', collection: 'content_assets', timestamps: true };

const ContentAssetSchema = new mongoose.Schema({}, options);

// Shared indexes that make sense on the base collection
ContentAssetSchema.index({ workspaceId: 1 }, { sparse: true });
ContentAssetSchema.index({ contentPieceId: 1 }, { sparse: true });

const ContentAsset = mongoose.model('ContentAsset', ContentAssetSchema);

// 1. Content Piece
const ContentPiece = ContentAsset.discriminator('ContentPiece', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  generatorType: { type: String, enum: GENERATOR_KEYS, required: true },
  targetType: {
    type: String,
    enum: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },

  brandVoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentConfig', default: null },
  promptTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentConfig', default: null },

  status: {
    type: String,
    enum: ['Draft', 'In Review', 'Approved', 'Rejected', 'Published'],
    default: 'Draft',
    required: true
  },

  currentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', default: null },

  inputs: { type: mongoose.Schema.Types.Mixed, default: {} },

  targetKeyword: { type: String, default: null },
  secondaryKeywords: [{ type: String }],
  seoScore: { type: Number, default: 0 },
  readabilityScore: { type: Number, default: 0 },
  entityCoverage: { type: Number, default: 0 },
  aiGenerationCount: { type: Number, default: 0 },
  
  assignedReviewerId: { type: mongoose.Schema.Types.ObjectId, default: null },
  rejectionReason: { type: String, default: null },
  publishedAt: { type: Date, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false, required: true }
}), 'piece');

ContentAssetSchema.index({ workspaceId: 1, status: 1 }, { sparse: true });
ContentAssetSchema.index({ workspaceId: 1, generatorType: 1 }, { sparse: true });
ContentAssetSchema.index({ targetType: 1, targetId: 1 }, { sparse: true });


// 2. Content Version
const ContentVersion = ContentAsset.discriminator('ContentVersion', new mongoose.Schema({
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', required: true, index: true },
  versionNumber: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  source: {
    type: String,
    enum: ['ai_generated', 'human_edited', 'ai_rewritten', 'ai_expanded', 'tone_optimized', 'restored'],
    required: true
  },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  qualityScore: {
    seo: { type: mongoose.Schema.Types.Mixed, default: null },
    readability: { type: mongoose.Schema.Types.Mixed, default: null },
    grammar: { type: mongoose.Schema.Types.Mixed, default: null },
    conversion: { type: mongoose.Schema.Types.Mixed, default: null },
    aiConfidence: { type: mongoose.Schema.Types.Mixed, default: null },
    overall: { type: Number, default: null }
  },
  restoredFromVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', default: null }
}), 'version');

ContentAssetSchema.index({ contentPieceId: 1, versionNumber: -1 }, { sparse: true });


// 3. Content Brief
const ContentBrief = ContentAsset.discriminator('ContentBrief', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', index: true },
  
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
}), 'brief');


// 4. Content Quality Score
const ContentQualityScore = ContentAsset.discriminator('ContentQualityScore', new mongoose.Schema({
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', required: true, index: true },
  contentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentAsset', required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  seo: { score: { type: Number, default: null }, findings: { type: [String], default: [] } },
  readability: { score: { type: Number, default: null }, gradeLevel: { type: Number, default: null }, findings: { type: [String], default: [] } },
  grammar: { score: { type: Number, default: null }, issues: { type: [{ text: String, suggestion: String, _id: false }], default: [] } },
  conversion: { score: { type: Number, default: null }, ctaPresent: { type: Boolean, default: false }, findings: { type: [String], default: [] } },
  aiConfidence: { score: { type: Number, default: null }, method: { type: String, enum: ['model_signal', 'self_consistency', 'unavailable'], default: 'unavailable' } },

  overall: { type: Number, default: null }
}), 'qualityScore');

ContentAssetSchema.index({ workspaceId: 1, overall: 1 }, { sparse: true });
ContentAssetSchema.index({ contentPieceId: 1, createdAt: -1 }, { sparse: true });


// 5. Content Block
const ContentBlock = ContentAsset.discriminator('ContentBlock', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['FAQ', 'CTA', 'Introduction', 'Conclusion', 'Testimonial', 'ProductFeature', 'SchemaSnippet', 'Callout', 'Custom'],
    required: true
  },
  
  content: { type: String, required: true },
  tags: [{ type: String }],
  
  usageCount: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  isDeleted: { type: Boolean, default: false }
}), 'block');

ContentAssetSchema.index({ workspaceId: 1, type: 1 }, { sparse: true });


module.exports = {
  ContentAsset,
  ContentPiece,
  ContentVersion,
  ContentBrief,
  ContentQualityScore,
  ContentBlock
};
