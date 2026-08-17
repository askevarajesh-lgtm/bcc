const { ContentPromptTemplate } = require('../models/contentConfig.model');

async function list(workspaceId, generatorType) {
  const query = { isDeleted: false, $or: [{ workspaceId }, { isGlobal: true }] };
  if (generatorType) query.generatorType = generatorType;
  return ContentPromptTemplate.find(query).sort({ isGlobal: 1, name: 1 }).lean();
}

async function create(workspaceId, data, userId) {
  return ContentPromptTemplate.create({ ...data, workspaceId, createdBy: userId });
}

async function update(workspaceId, id, data) {
  const template = await ContentPromptTemplate.findOneAndUpdate(
    { _id: id, workspaceId, isDeleted: false },
    data,
    { new: true }
  );
  if (!template) throw new Error('Content prompt template not found');
  return template;
}

async function remove(workspaceId, id) {
  const template = await ContentPromptTemplate.findOneAndUpdate(
    { _id: id, workspaceId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!template) throw new Error('Content prompt template not found');
  return template;
}

/**
 * Turns a saved template + the caller's variable values into the extra
 * prompt material `contentGeneration.service.js` folds into the generator's
 * default prompt (or fully overrides it, if `promptOverride` is set).
 */
async function instantiate(templateId, variableValues = {}) {
  if (!templateId) return null;
  const template = await ContentPromptTemplate.findById(templateId).lean();
  if (!template || template.isDeleted) throw new Error('Content prompt template not found');

  const missing = (template.variables || []).filter((v) => v.required && !variableValues[v.key]);
  if (missing.length) {
    throw new Error(`Missing required template variable(s): ${missing.map((v) => v.key).join(', ')}`);
  }

  const filledVariables = (template.variables || []).map((v) => `${v.label || v.key}: ${variableValues[v.key] || ''}`).join('\n');

  return {
    promptOverride: template.promptOverride || '',
    variablesBlock: filledVariables
  };
}

module.exports = { list, create, update, remove, instantiate };
