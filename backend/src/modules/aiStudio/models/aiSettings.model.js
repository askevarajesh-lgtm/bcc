const mongoose = require('mongoose');

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
  isEnabled: {
    type: Boolean,
    default: true
  },
  model: {
    type: String,
    default: "gpt-4o-mini"
  }
}, { timestamps: true });

module.exports = mongoose.model('AiSettings', AiSettingsSchema, 'ai_settings');
