/**
 * ContentAI — BrandVoice
 *
 * Deliberately keyed on a plain `workspaceId` field, not a `ref:` to
 * 'Brand' or 'Workspace' — neither model is registered anywhere in this
 * codebase (confirmed by inspection, see bcc-platform-analysis.md §8's
 * dangling-ref list). Mirrors the same plain-field convention already used
 * by `stores/store.model.js` and `seoWorkspace/models/workspaceProject.model.js`.
 */
const mongoose = require('mongoose');

const BrandVoiceSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false, required: true },

  audience: {
    description: { type: String, default: '' },
    painPoints: { type: [String], default: [] },
    demographics: { type: String, default: '' }
  },

  tone: {
    primary: { type: String, default: 'Professional' },
    traits: { type: [String], default: [] }
  },

  language: {
    primary: { type: String, default: 'en' },
    locale: { type: String, default: 'en-US' }
  },

  style: {
    vocabularyLevel: { type: String, enum: ['simple', 'professional', 'technical'], default: 'professional' },
    sentenceLength: { type: String, enum: ['short', 'mixed', 'long'], default: 'mixed' },
    prohibitedWords: { type: [String], default: [] },
    requiredPhrases: { type: [String], default: [] },
    exampleSamples: { type: [String], default: [] }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

BrandVoiceSchema.index({ workspaceId: 1, isDefault: 1 });
BrandVoiceSchema.index({ workspaceId: 1, name: 1 });

module.exports = mongoose.model('BrandVoice', BrandVoiceSchema);
