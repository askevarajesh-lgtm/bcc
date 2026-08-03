const Store = require('../../stores/store.model');
const Product = require('../../stores/product.model');
const WorkspaceStoreSeo = require('../models/storeSeo.model');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'store-seo-agent';
const TAG = 'StoreSeoAgent';

const VALID_FINDING_TYPES = [
  'missing_seo_title', 'seo_title_too_short', 'seo_title_too_long',
  'missing_seo_description', 'seo_description_too_short', 'seo_description_too_long',
  'missing_og_image', 'missing_favicon', 'thin_catalog', 'products_missing_images'
];

const METADATA_FINDING_TYPES = new Set([
  'missing_seo_title', 'seo_title_too_short', 'seo_title_too_long',
  'missing_seo_description', 'seo_description_too_short', 'seo_description_too_long'
]);

const SEVERITY_BY_FINDING_TYPE = {
  missing_seo_title: 'high',
  missing_seo_description: 'high',
  thin_catalog: 'high',
  seo_title_too_short: 'medium',
  seo_title_too_long: 'medium',
  seo_description_too_short: 'medium',
  seo_description_too_long: 'medium',
  products_missing_images: 'medium',
  missing_og_image: 'low',
  missing_favicon: 'low'
};

const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const META_DESCRIPTION_MIN_LENGTH = 70;
const META_DESCRIPTION_MAX_LENGTH = 160;
const THIN_CATALOG_PRODUCT_THRESHOLD = 4; // fewer than this many live products is a thin, low-signal catalog

function validateTitleValue(value, currentValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed SEO title is empty'); return errors; }
  if (trimmed.length > TITLE_MAX_LENGTH + 15) errors.push(`Proposed SEO title is far longer than the ${TITLE_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed SEO title is identical to the flagged current title');
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  const stuffed = Object.entries(counts).find(([w, c]) => w.length > 3 && c >= 3);
  if (stuffed) errors.push(`Proposed SEO title repeats "${stuffed[0]}" ${stuffed[1]} times (keyword stuffing)`);
  return errors;
}

function validateDescriptionValue(value, currentValue, titleValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed SEO description is empty'); return errors; }
  if (trimmed.length > META_DESCRIPTION_MAX_LENGTH + 30) errors.push(`Proposed SEO description is far longer than the ${META_DESCRIPTION_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed SEO description is identical to the flagged current description');
  if (titleValue && trimmed.toLowerCase() === titleValue.trim().toLowerCase()) errors.push('Proposed SEO description just restates the title');
  return errors;
}

function validateFinding(finding, candidate) {
  if (!METADATA_FINDING_TYPES.has(finding.findingType)) {
    return (finding.rationale || '').trim() ? [] : ['Missing rationale for structural finding'];
  }
  if (finding.findingType.startsWith('missing_seo_title') || finding.findingType.startsWith('seo_title')) {
    return validateTitleValue(finding.proposedValue, candidate.currentSeoTitle);
  }
  return validateDescriptionValue(finding.proposedValue, candidate.currentSeoDescription, finding.findingType.startsWith('seo_description') || finding.findingType === 'missing_seo_description' ? candidate.currentSeoTitle : null);
}

/**
 * @param {Object} store - a Store document
 * @returns {Promise<Object>} signals matching WorkspaceStoreSeo.inputs
 */
async function collectStoreSeoSignals(store) {
  const [productCount, productsMissingImagesCount] = await Promise.all([
    Product.countDocuments({ storeId: store._id, isDeleted: false }),
    Product.countDocuments({
      storeId: store._id,
      isDeleted: false,
      $or: [{ images: { $exists: false } }, { images: { $size: 0 } }]
    })
  ]);

  return {
    storeName: store.storeName,
    currentSeoTitle: store.seoTitle || '',
    currentSeoDescription: store.seoDescription || '',
    hasOgImage: Boolean(store.ogImageUrl),
    hasFavicon: Boolean(store.faviconUrl),
    productCount,
    productsMissingImagesCount,
    dataSource: 'stored-content'
  };
}

function buildEligibleFindingTypes(signals) {
  const eligible = [];

  if (!signals.currentSeoTitle) eligible.push('missing_seo_title');
  else if (signals.currentSeoTitle.length < TITLE_MIN_LENGTH) eligible.push('seo_title_too_short');
  else if (signals.currentSeoTitle.length > TITLE_MAX_LENGTH) eligible.push('seo_title_too_long');

  if (!signals.currentSeoDescription) eligible.push('missing_seo_description');
  else if (signals.currentSeoDescription.length < META_DESCRIPTION_MIN_LENGTH) eligible.push('seo_description_too_short');
  else if (signals.currentSeoDescription.length > META_DESCRIPTION_MAX_LENGTH) eligible.push('seo_description_too_long');

  if (!signals.hasOgImage) eligible.push('missing_og_image');
  if (!signals.hasFavicon) eligible.push('missing_favicon');
  if (signals.productCount < THIN_CATALOG_PRODUCT_THRESHOLD) eligible.push('thin_catalog');
  if (signals.productsMissingImagesCount > 0) eligible.push('products_missing_images');

  return eligible;
}

/**
 * @param {Object} store
 * @param {Object} signals - from collectStoreSeoSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, findings: Array }>}
 */
async function generateStoreSeoFindings(store, signals, workspaceId) {
  const eligibleFindingTypes = buildEligibleFindingTypes(signals);
  if (eligibleFindingTypes.length === 0) {
    return { summary: 'No storefront SEO metadata or catalog-completeness issues were found for this store.', findings: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: store._id });

  const prompt = `You are the Store SEO Agent for the storefront "${store.storeName}". Propose recommendations ONLY for the finding type(s) listed below — do not propose a finding type that isn't listed, and do not invent one.

Eligible finding types for this store: ${JSON.stringify(eligibleFindingTypes)}

Current measured state (grounded in what was actually stored for this store — do not invent content beyond this):
${JSON.stringify({
    storeName: signals.storeName,
    currentSeoTitle: signals.currentSeoTitle,
    currentSeoDescription: signals.currentSeoDescription,
    hasOgImage: signals.hasOgImage,
    hasFavicon: signals.hasFavicon,
    productCount: signals.productCount,
    productsMissingImagesCount: signals.productsMissingImagesCount
  }, null, 2)}
${skillsBlock}
${memoryBlock}

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was generated and why",
  "findings": [
    {
      "findingType": "must be one of the eligible finding types listed above",
      "currentValue": "the current seoTitle/seoDescription, empty string if none or not applicable",
      "proposedValue": "for missing_seo_title/seo_title_too_short/seo_title_too_long: a new SEO title (30-60 chars) grounded in the store name. For missing_seo_description/seo_description_too_short/seo_description_too_long: a new SEO description (70-160 chars). For every other finding type: empty string.",
      "rationale": "1-2 sentence justification grounded in the measured state given"
    }
  ]
}
One finding object per eligible finding type. Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: store._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 1200,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI store-seo-generation JSON for store ${store._id}: ${error.message}`, { projectId: store._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', findings: [] };
  }

  const candidate = {
    currentSeoTitle: signals.currentSeoTitle,
    currentSeoDescription: signals.currentSeoDescription
  };

  const generated = (Array.isArray(parsed.findings) ? parsed.findings : [])
    .filter((f) => f.findingType && VALID_FINDING_TYPES.includes(f.findingType) && eligibleFindingTypes.includes(f.findingType))
    .map((f) => {
      const validationErrors = validateFinding(f, candidate);
      const isMetadata = METADATA_FINDING_TYPES.has(f.findingType);
      const fallbackCurrentValue = f.findingType.includes('title') ? candidate.currentSeoTitle : candidate.currentSeoDescription;

      return {
        findingType: f.findingType,
        severity: SEVERITY_BY_FINDING_TYPE[f.findingType],
        currentValue: f.currentValue || (isMetadata ? fallbackCurrentValue : '') || '',
        proposedValue: isMetadata ? (f.proposedValue || '') : '',
        rationale: (f.rationale || '') + (validationErrors.length ? ` [VALIDATION: ${validationErrors.join('; ')}]` : ''),
        isValid: validationErrors.length === 0
      };
    });

  return { summary: parsed.summary || '', findings: generated };
}

/**
 * @param {string} storeId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceStoreSeo document
 */
async function run(storeId, workspaceId) {
  const store = await Store.findOne({ _id: storeId, isDeleted: false });
  if (!store) throw new Error('Store not found');

  const agencyId = workspaceId || store.workspaceId;

  return executionQueue.run(`store-seo-agent:${storeId}`, async () => {
    const executionId = `storeSeoAgent:${storeId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'storeSeoAgent', agentKey: AGENT_KEY, projectId: storeId, status: 'started' });

    try {
      const signals = await collectStoreSeoSignals(store);
      const { summary, findings } = await generateStoreSeoFindings(store, signals, agencyId);

      const savedRun = await WorkspaceStoreSeo.create({
        storeId: store._id,
        agencyId,
        status: 'completed',
        inputs: signals,
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          findings,
          approvalStatus: findings.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'storeSeoAgent', agentKey: AGENT_KEY, projectId: storeId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { runId: savedRun._id, findingCount: findings.length, invalidCount: findings.filter((f) => !f.isValid).length }
      });

      return savedRun;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'storeSeoAgent', agentKey: AGENT_KEY, projectId: storeId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} runId
 * @param {string} storeId
 * @param {string} userId
 */
async function approveFindings(runId, storeId, userId) {
  const run = await WorkspaceStoreSeo.findOne({ _id: runId, storeId });
  if (!run) throw new Error('Store SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Findings must be 'Pending Approval' to approve. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Approved';
  run.agent.approvedBy = userId;
  run.agent.approvedAt = new Date();
  run.agent.rejectionReason = null;

  const taskTypeByFindingType = {
    missing_seo_title: 'Update Store SEO Metadata', seo_title_too_short: 'Update Store SEO Metadata', seo_title_too_long: 'Update Store SEO Metadata',
    missing_seo_description: 'Update Store SEO Metadata', seo_description_too_short: 'Update Store SEO Metadata', seo_description_too_long: 'Update Store SEO Metadata',
    missing_og_image: 'Add Social Share Image',
    missing_favicon: 'Add Favicon',
    thin_catalog: 'Expand Product Catalog',
    products_missing_images: 'Add Product Images'
  };

  run.agent.generatedTasks = (run.agent.findings || [])
    .filter((f) => f.isValid)
    .map((f) => ({
      taskType: taskTypeByFindingType[f.findingType],
      description: `[Store SEO Agent] ${f.findingType.replace(/_/g, ' ')} on store "${run.inputs.storeName}"${f.proposedValue ? `: "${f.proposedValue}"` : ` — ${f.rationale}`}`,
      proposedChanges: { findingType: f.findingType, currentValue: f.currentValue, proposedValue: f.proposedValue, rationale: f.rationale },
      status: 'Pending'
    }));

  await run.save();

  logger.info(TAG, `Findings approved for store ${storeId}`, { runId, storeId, userId, taskCount: run.agent.generatedTasks.length });

  return { run, createdTasks: run.agent.generatedTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectFindings(runId, storeId, userId, reason) {
  const run = await WorkspaceStoreSeo.findOne({ _id: runId, storeId });
  if (!run) throw new Error('Store SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Findings must be 'Pending Approval' to reject. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Rejected';
  run.agent.rejectionReason = reason || null;
  await run.save();

  logger.info(TAG, `Findings rejected for store ${storeId}`, { runId, storeId, userId, reason });

  await recordRejectedFindingsIfAny(run, userId, reason);

  return run;
}

async function recordRejectedFindingsIfAny(run, userId, reason) {
  try {
    const findings = run.agent?.findings || [];
    if (findings.length === 0) return;

    const agencyId = run.agencyId || userId;

    for (const f of findings.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId: run.storeId,
        title: `Rejected storefront SEO finding: ${f.findingType} on store "${run.inputs.storeName}"`,
        description: `The Store SEO Agent's ${f.findingType} finding for store "${run.inputs.storeName}" was rejected.`,
        content: reason
          ? `Do not propose ${f.findingType} for store "${run.inputs.storeName}" again. Reason given: ${reason}`
          : `Do not propose ${f.findingType} for store "${run.inputs.storeName}" again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record rejected-finding memory for store ${run.storeId}: ${error.message}`, { storeId: run.storeId });
  }
}

/**
 * @param {string} storeId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(storeId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId: storeId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'storeSeoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectStoreSeoSignals,
  generateStoreSeoFindings,
  validateTitleValue,
  validateDescriptionValue,
  approveFindings,
  rejectFindings,
  getExecutionHistory
};
