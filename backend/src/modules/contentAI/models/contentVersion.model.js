/**
 * ContentAI — ContentVersion.
 *
 * Immutable by convention (application code never updates a version in
 * place — every generation/edit/rewrite/expand/tone-pass creates a new
 * document and repoints `ContentPiece.currentVersionId`). This IS the
 * version-history + audit trail for content changes; see
 * contentAI.md notes on why `WorkspaceAuditLog` isn't reused here (its
 * `targetType` enum and required `projectId: ref WorkspaceProject` don't
 * fit a ContentPiece, which isn't a WorkspaceProject artifact).
 */
const mongoose = require('mongoose');

const ContentVersionSchema = new mongoose.Schema({
  contentPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentPiece', required: true, index: true },
  versionNumber: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  source: {
    type: String,
    enum: ['ai_generated', 'human_edited', 'ai_rewritten', 'ai_expanded', 'tone_optimized', 'restored'],
    required: true
  },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  qualityScore: {
    seo: { type: Number, default: null },
    readability: { type: Number, default: null },
    grammar: { type: Number, default: null },
    conversion: { type: Number, default: null },
    aiConfidence: { type: Number, default: null },
    overall: { type: Number, default: null }
  },
  restoredFromVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentVersion', default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

ContentVersionSchema.index({ contentPieceId: 1, versionNumber: -1 });

module.exports = mongoose.model('ContentVersion', ContentVersionSchema);
