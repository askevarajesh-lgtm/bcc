const mongoose = require('mongoose');
const { GENERATOR_KEYS } = require('../generators/registry');

const ContentPieceSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  generatorType: { type: String, enum: GENERATOR_KEYS, required: true, index: true },
  targetType: {
    type: String,
    enum: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
    required: true
  },
  // Page._id / BlogPost._id / Product._id / StoreCollection._id — intentionally not a `ref:`
  // to any single model, since targetType determines which collection this points into.
  // Populate manually by targetType where needed, same pattern WorkspaceAuditLog's
  // polymorphic targetType/targetId pair already uses.
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },

  brandVoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandVoice', default: null },
  promptTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentPromptTemplate', default: null },

  status: {
    type: String,
    enum: ['Draft', 'In Review', 'Approved', 'Rejected', 'Published'],
    default: 'Draft',
    required: true
  },

  currentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentVersion', default: null },

  inputs: { type: mongoose.Schema.Types.Mixed, default: {} },

  // SEO & Intelligence
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
}, { timestamps: true });

ContentPieceSchema.index({ workspaceId: 1, status: 1 });
ContentPieceSchema.index({ workspaceId: 1, generatorType: 1 });
ContentPieceSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('ContentPiece', ContentPieceSchema);
