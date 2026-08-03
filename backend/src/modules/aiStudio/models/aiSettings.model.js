const mongoose = require('mongoose');
const { DEFAULT_AI_PROVIDER, DEFAULT_AI_MODEL } = require('../../aiCore/config/aiDefaults');

const AiSettingsSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    unique: true
  },
  openaiApiKey: {
    type: String,
    default: null
  },
  anthropicApiKey: {
    type: String,
    default: null
  },
  contentAnthropicApiKey: {
    type: String,
    default: null
  },
  aiProvider: {
    type: String,
    enum: ["openai", "anthropic"],
    default: DEFAULT_AI_PROVIDER
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  model: {
    type: String,
    default: DEFAULT_AI_MODEL
  }
}, { timestamps: true });

module.exports = mongoose.model('AiSettings', AiSettingsSchema, 'ai_settings');