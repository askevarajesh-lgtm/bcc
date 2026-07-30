const BrandVoice = require('../models/brandVoice.model');

/**
 * Every one of the 14 generators resolves its brand-voice inputs the same
 * way, in this one place — see content-ai-platform-architecture.md §3.
 */
async function resolveEffective(workspaceId, brandVoiceId) {
  if (brandVoiceId) {
    const explicit = await BrandVoice.findOne({ _id: brandVoiceId, workspaceId, isDeleted: false }).lean();
    if (explicit) return explicit;
  }

  const workspaceDefault = await BrandVoice.findOne({ workspaceId, isDefault: true, isDeleted: false }).lean();
  if (workspaceDefault) return workspaceDefault;

  // Neutral fallback — generation must never be blocked by a missing brand voice.
  return {
    name: 'Neutral Fallback',
    tone: { primary: 'Professional', traits: [] },
    audience: { description: '', painPoints: [], demographics: '' },
    language: { primary: 'en', locale: 'en-US' },
    style: { vocabularyLevel: 'professional', sentenceLength: 'mixed', prohibitedWords: [], requiredPhrases: [], exampleSamples: [] }
  };
}

async function list(workspaceId) {
  return BrandVoice.find({ workspaceId, isDeleted: false }).sort({ isDefault: -1, name: 1 }).lean();
}

async function create(workspaceId, data, userId) {
  if (data.isDefault) {
    await BrandVoice.updateMany({ workspaceId, isDeleted: false }, { $set: { isDefault: false } });
  }
  return BrandVoice.create({ ...data, workspaceId, createdBy: userId, updatedBy: userId });
}

async function update(workspaceId, id, data, userId) {
  if (data.isDefault) {
    await BrandVoice.updateMany({ workspaceId, isDeleted: false, _id: { $ne: id } }, { $set: { isDefault: false } });
  }
  const brandVoice = await BrandVoice.findOneAndUpdate(
    { _id: id, workspaceId, isDeleted: false },
    { ...data, updatedBy: userId },
    { new: true }
  );
  if (!brandVoice) throw new Error('Brand voice not found');
  return brandVoice;
}

async function remove(workspaceId, id) {
  const brandVoice = await BrandVoice.findOneAndUpdate(
    { _id: id, workspaceId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!brandVoice) throw new Error('Brand voice not found');
  return brandVoice;
}

module.exports = { resolveEffective, list, create, update, remove };
