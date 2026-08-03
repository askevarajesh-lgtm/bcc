/**
 * ContentAI — ContentQualityScore.
 *
 * Kept as its own collection (not just the embedded snapshot on
 * ContentVersion) so scores are queryable/reportable independent of a
 * specific version, e.g. a workspace-wide "everything below 60 on
 * Conversion" report without scanning every version document.
 */
const mongoose = require('mongoose');

const ContentQualityScoreSchema = new mongoose.Schema({
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentPiece', required: true, index: true },
  contentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentVersion', required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  seo: { score: { type: Number, default: null }, findings: { type: [String], default: [] } },
  readability: { score: { type: Number, default: null }, gradeLevel: { type: Number, default: null }, findings: { type: [String], default: [] } },
  grammar: { score: { type: Number, default: null }, issues: { type: [{ text: String, suggestion: String, _id: false }], default: [] } },
  conversion: { score: { type: Number, default: null }, ctaPresent: { type: Boolean, default: false }, findings: { type: [String], default: [] } },
  aiConfidence: { score: { type: Number, default: null }, method: { type: String, enum: ['model_signal', 'self_consistency', 'unavailable'], default: 'unavailable' } },

  overall: { type: Number, default: null }
}, { timestamps: true });

ContentQualityScoreSchema.index({ workspaceId: 1, overall: 1 });
ContentQualityScoreSchema.index({ contentPieceId: 1, createdAt: -1 });

module.exports = mongoose.model('ContentQualityScore', ContentQualityScoreSchema);
