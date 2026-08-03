/**
 * ContentAI — ContentPromptTemplate
 *
 * Deliberately a SEPARATE model from `templates/template.model.js` (that
 * model is GrapesJS page/zip templates — `type: ['website','store','funnel','form']`).
 * This is prompt configuration for the 14 ContentAI generators — a
 * different concept that happens to share the word "template." Naming it
 * ContentPromptTemplate (not Template) avoids colliding with that model's
 * unrelated enum. See content-ai-platform-architecture.md §2.
 */
const mongoose = require('mongoose');
const { GENERATOR_KEYS } = require('../generators/registry');

const ContentPromptTemplateSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  generatorType: { type: String, enum: GENERATOR_KEYS, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  variables: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, default: '' },
      required: { type: Boolean, default: false },
      _id: false
    }],
    default: []
  },
  promptOverride: { type: String, default: '' },
  isGlobal: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

ContentPromptTemplateSchema.index({ workspaceId: 1, generatorType: 1 });

module.exports = mongoose.model('ContentPromptTemplate', ContentPromptTemplateSchema);
