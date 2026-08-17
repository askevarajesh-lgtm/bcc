/**
 * ContentAI — Content Generation.
 *
 * The single entry point every one of the 14 generators shares (§4 of
 * content-ai-platform-architecture.md). Nothing here is generator-specific
 * beyond looking up the right config from generators/registry.js — no
 * per-generator branching, no per-generator persistence logic.
 */
const agentLoader = require('../../aiCore/agentLoader.service');
const aiEngine = require('../../aiCore/aiEngine.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const logger = require('../../aiCore/logger.service');

const { getGenerator } = require('../generators/registry');
const { ContentPiece } = require('../models/contentAsset.model');
const brandVoiceService = require('./brandVoice.service');
const contentTemplateService = require('./contentTemplate.service');
const contentVersioning = require('./contentVersioning.service');
const qualityScoring = require('./qualityScoring');

const TAG = 'ContentGeneration';

/**
 * The version-`source` value to record based on which generator ran.
 * Generators 12-14 (Rewriter/Expander/Tone Optimizer) always operate on an
 * existing version and never overwrite the version they read from — see
 * §4's note.
 */
const SOURCE_BY_GENERATOR = {
  'content-rewriter': 'ai_rewritten',
  'content-expander': 'ai_expanded',
  'tone-optimizer': 'tone_optimized'
};

function stripJsonFences(raw) {
  if (typeof raw !== 'string') return raw;
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
}

function safeParseJson(raw) {
  try {
    return JSON.parse(stripJsonFences(raw));
  } catch (error) {
    throw new Error(`ContentGeneration: model did not return valid JSON (${error.message}). Raw output: ${String(raw).slice(0, 500)}`);
  }
}

async function runGenerator({ workspaceId, userId, generatorType, inputs, brandVoiceOverrideId, promptTemplateId, contentPieceId, agencyIdForMemory }) {
  const generator = getGenerator(generatorType);

  const missing = (generator.requiredInputFields || []).filter((field) => {
    const value = inputs?.[field];
    return value === undefined || value === null || value === '';
  });
  if (missing.length) {
    throw new Error(`ContentGeneration: missing required input field(s) for ${generatorType}: ${missing.join(', ')}`);
  }

  const [agentConfig, brandVoice, template, memoryContext] = await Promise.all([
    agentLoader.resolve(generator.agentKey),
    brandVoiceService.resolveEffective(workspaceId, brandVoiceOverrideId),
    contentTemplateService.instantiate(promptTemplateId, inputs?.templateVariables || {}),
    sharedMemory.recallAsPromptContext({ agencyId: agencyIdForMemory || userId, projectId: contentPieceId }).catch(() => '')
  ]);

  const skillsText = agentLoader.loadSkillsForAgent(agentConfig);

  let systemPrompt = `${generator.systemPromptIntro}\n${skillsText}${memoryContext}`;
  if (template?.promptOverride) {
    systemPrompt += `\n--- Workspace-specific instructions ---\n${template.promptOverride}`;
  }

  let userPrompt = generator.buildUserPrompt(inputs, brandVoice);
  if (template?.variablesBlock) {
    userPrompt += `\n--- Template variables ---\n${template.variablesBlock}`;
  }

  const raw = await aiEngine.complete({
    workspaceId,
    model: agentConfig.modelName,
    jsonMode: true,
    agentKey: generator.agentKey,
    projectId: contentPieceId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  const payload = safeParseJson(raw);

  const qualityScore = await qualityScoring.scoreContent(generator.qualityAxes, payload, {
    workspaceId,
    model: agentConfig.modelName,
    contentPieceId,
    originalPrompt: userPrompt
  });

  return { generator, payload, qualityScore, brandVoice, userPrompt };
}

/**
 * Creates a brand-new ContentPiece and its first ContentVersion.
 */
async function generate({ workspaceId, userId, generatorType, targetType, targetId = null, inputs = {}, brandVoiceId = null, promptTemplateId = null, agencyIdForMemory = null }) {
  const generator = getGenerator(generatorType);
  if (!generator.targetTypes.includes(targetType)) {
    throw new Error(`ContentGeneration: generator "${generatorType}" does not support targetType "${targetType}". Supported: ${generator.targetTypes.join(', ')}`);
  }

  const contentPiece = await ContentPiece.create({
    workspaceId,
    generatorType,
    targetType,
    targetId,
    brandVoiceId: brandVoiceId || null,
    promptTemplateId: promptTemplateId || null,
    inputs,
    status: 'Draft',
    createdBy: userId
  });

  try {
    const { payload, qualityScore } = await runGenerator({
      workspaceId, userId, generatorType, inputs, brandVoiceOverrideId: brandVoiceId, promptTemplateId,
      contentPieceId: contentPiece._id, agencyIdForMemory
    });

    const version = await contentVersioning.createVersion({
      contentPieceId: contentPiece._id,
      source: 'ai_generated',
      payload,
      qualityScore,
      createdBy: userId
    });

    await persistQualityScoreRecord(contentPiece, version, qualityScore, workspaceId);

    logger.info(TAG, `Generated ${generatorType} for contentPiece ${contentPiece._id}`, { versionNumber: version.versionNumber });

    return { contentPiece: await ContentPiece.findById(contentPiece._id).lean(), version };
  } catch (error) {
    // The ContentPiece already exists (Draft, no version) — leave it for the
    // user to retry rather than silently deleting their generation request.
    logger.error(TAG, `Generation failed for contentPiece ${contentPiece._id}: ${error.message}`);
    throw error;
  }
}

/**
 * Re-runs generation for an existing ContentPiece — used for plain
 * regeneration, and for the Rewriter/Expander/Tone Optimizer generators
 * operating on a piece's current content (caller passes the source text in
 * `inputs.sourceContent`, typically pulled from the current version's payload).
 * Never changes `ContentPiece.status` — regenerating an in-review piece
 * does not silently resubmit or un-submit it.
 */
async function regenerate({ workspaceId, userId, contentPieceId, generatorType = null, inputs = null, brandVoiceId = null, promptTemplateId = null, agencyIdForMemory = null }) {
  const contentPiece = await ContentPiece.findOne({ _id: contentPieceId, workspaceId, isDeleted: false });
  if (!contentPiece) throw new Error('Content piece not found');

  const effectiveGeneratorType = generatorType || contentPiece.generatorType;
  const effectiveInputs = inputs || contentPiece.inputs || {};

  const { payload, qualityScore } = await runGenerator({
    workspaceId, userId,
    generatorType: effectiveGeneratorType,
    inputs: effectiveInputs,
    brandVoiceOverrideId: brandVoiceId || contentPiece.brandVoiceId,
    promptTemplateId: promptTemplateId || contentPiece.promptTemplateId,
    contentPieceId: contentPiece._id,
    agencyIdForMemory
  });

  const source = SOURCE_BY_GENERATOR[effectiveGeneratorType] || 'ai_generated';

  const version = await contentVersioning.createVersion({
    contentPieceId: contentPiece._id,
    source,
    payload,
    qualityScore,
    createdBy: userId
  });

  await persistQualityScoreRecord(contentPiece, version, qualityScore, workspaceId);

  if (inputs) {
    contentPiece.inputs = effectiveInputs;
    await contentPiece.save();
  }

  logger.info(TAG, `Regenerated (${source}) for contentPiece ${contentPiece._id}`, { versionNumber: version.versionNumber });

  return { contentPiece: await ContentPiece.findById(contentPiece._id).lean(), version };
}

async function persistQualityScoreRecord(contentPiece, version, qualityScore, workspaceId) {
  const { ContentQualityScore } = require('../models/contentAsset.model');
  try {
    await ContentQualityScore.create({
      contentPieceId: contentPiece._id,
      contentVersionId: version._id,
      workspaceId,
      seo: qualityScore.seo || {},
      readability: qualityScore.readability || {},
      grammar: qualityScore.grammar || {},
      conversion: qualityScore.conversion || {},
      aiConfidence: qualityScore.aiConfidence || {},
      overall: qualityScore.overall ?? null
    });
  } catch (error) {
    // Scoring/persistence of the score record must never fail the generation itself.
    logger.warn(TAG, `Failed to persist ContentQualityScore for version ${version._id}: ${error.message}`);
  }
}

module.exports = { generate, regenerate };
