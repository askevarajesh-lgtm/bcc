const mongoose = require('mongoose');

const options = { discriminatorKey: 'assetType', collection: 'content_configs', timestamps: true };

const ContentConfigSchema = new mongoose.Schema({}, options);

ContentConfigSchema.index({ workspaceId: 1 }, { sparse: true });

const ContentConfig = mongoose.model('ContentConfig', ContentConfigSchema);

// 1. Brand Voice
const BrandVoice = ContentConfig.discriminator('BrandVoice', new mongoose.Schema({
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
}), 'brandVoice');

ContentConfigSchema.index({ workspaceId: 1, isDefault: 1 }, { sparse: true });
ContentConfigSchema.index({ workspaceId: 1, name: 1 }, { sparse: true });


// 2. Content Prompt Template
const ContentPromptTemplate = ContentConfig.discriminator('ContentPromptTemplate', new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  generatorType: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  
  systemPrompt: { type: String, required: true },
  userPromptTemplate: { type: String, required: true },
  
  parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  promptOverride: { type: String, default: '' },
  isGlobal: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false, required: true }
}), 'promptTemplate');

ContentConfigSchema.index({ workspaceId: 1, generatorType: 1 }, { sparse: true });

module.exports = {
  ContentConfig,
  BrandVoice,
  ContentPromptTemplate
};
