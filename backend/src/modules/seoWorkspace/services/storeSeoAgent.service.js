/**
 * Store SEO Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * An eleventh agent alongside the ten already in this module
 * (seoAuditorAgent, keywordResearchAgent, competitorAgent, technicalSeoAgent,
 * contentAgent, schemaAgent, internalLinkingAgent, imageSeoAgent,
 * websiteBuilderSeoAgent, blogSeoAgent) — closest in shape to
 * `websiteBuilderSeoAgent.service.js`/`blogSeoAgent.service.js`, but a
 * deliberately different target and a narrower signal set: this agent
 * analyzes a `Store` document directly (`modules/stores/store.model.js`),
 * not a crawlable `WorkspaceProject` domain, a Website Builder `Page`, or a
 * `BlogPost`.
 *
 * The Store/Product/StoreCollection/StorePage schemas in this codebase
 * today do NOT carry a per-product or per-page `metaTitle`/`metaDescription`
 * (see `product.model.js` — just `name`/`price`/`stock`/`images`; and
 * `store-page.model.js` — just `pageName`/`slug`/`type`/`layoutJson`, no
 * head/meta fields). Only the `Store` document itself has genuinely
 * SEO-relevant fields today: `seoTitle`, `seoDescription`, `ogImageUrl`,
 * `faviconUrl`. Rather than inventing new schema fields on Product/StorePage
 * to give this agent something page-level to analyze (which would be
 * fabricating data model surface area to fit the agent, not reusing what's
 * there — the exact anti-pattern this module's other agents' headers warn
 * against), this agent analyzes storefront-wide SEO signals: the Store's own
 * metadata fields, plus deterministic, code-level catalog-completeness
 * counts against the store's existing `Product` documents (missing images,
 * thin catalog) that are already visible in the schema as it stands. If
 * per-product/per-page metadata fields are added to those schemas later,
 * this agent is the natural place to extend with per-entity findings the
 * same way `blogSeoAgent`/`websiteBuilderSeoAgent` do per-post/per-page —
 * out of scope for this pass.
 *
 * Same two-phase shape as the other ten agents:
 *   1. collectStoreSeoSignals() – gathers OBJECTIVE metadata/catalog signals
 *      for one Store: its seoTitle/seoDescription/ogImageUrl/faviconUrl, and
 *      — via plain deterministic `Product.countDocuments` queries against
 *      this store's own products — its total active product count and how
 *      many of those products have an empty `images` array. No AI involved;
 *      every flag is a deterministic, code-level check, same "objective
 *      phase" discipline the other agents' Phase 1 already follows.
 *   2. generateStoreSeoFindings() – the actual "agent" step: an AI call with
 *      this agent's own prompt (reusing the
 *      builder-onpage-metadata-optimization + technical-infrastructure-audit
 *      skills — see reuse note below) proposes a new seoTitle/seoDescription
 *      for metadata findings and a short rationale for the storefront-
 *      completeness findings (missing OG image, missing favicon, thin
 *      catalog, products missing images), restricted to only the finding
 *      types Phase 1 actually flagged. Every returned finding is then run
 *      through deterministic, code-level validation (findingType must be
 *      one Phase 1 actually flagged, proposed value length + no duplication
 *      of the current bad value, no metadata value proposed for a
 *      structural-only finding type) so a human reviewer isn't relying on
 *      the model's self-grading of its own output. Results sit behind the
 *      same human-approval gate pattern as the other agents
 *      (WorkspaceStoreSeo.agent.approvalStatus) before any task is generated
 *      from them.
 *
 * Reuse decisions (nothing here is new infra beyond what's noted):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution) —
 *     the exact same generic infra the other ten agents use.
 *   - Product catalog counts reuse the existing `Product` model
 *     (`modules/stores/product.model.js`) via plain `countDocuments`
 *     queries — no second product-aggregation service.
 *   - Prompt skills: reuses `builder-onpage-metadata-optimization` (same
 *     title/meta-description length-and-groundedness methodology
 *     `blogSeoAgent`/`websiteBuilderSeoAgent` already reuse — a storefront's
 *     SEO title/description follows the exact same rules as a page's) and
 *     `technical-infrastructure-audit` (its "only report on a category if
 *     the input actually contains a signal for it; never invent a finding"
 *     discipline is exactly the guardrail needed for the storefront-
 *     completeness findings — og:image/favicon are literally `<head>`-level
 *     technical signals, and this skill already covers that territory)
 *     rather than writing near-duplicate skill files.
 *   - Runs for the same store are serialized through aiCore's
 *     executionQueue under a distinct key so a run never blocks (or is
 *     blocked by) the other ten agents, or another run for a different
 *     store.
 *   - Shared memory: recalled before generation (so a prior "don't touch
 *     this store's SEO title again, marketing signed off on it" note steers
 *     the AI away from repeating a rejected suggestion); written to when a
 *     run's findings are rejected — same pattern as
 *     blogSeoAgent.recordRejectedFindingsIfAny /
 *     websiteBuilderSeoAgent.recordRejectedFindingsIfAny. Scoped by
 *     `agencyId` (required by `WorkspaceMemory`) with this store's own id
 *     passed as the memory's `projectId` field — that field is a loose,
 *     unenforced ref used purely for filtering (see
 *     sharedMemory.service.js — recall() never populates it), same safe
 *     reuse the other two content-target agents already rely on.
 *   - Persists its own run output to a new `WorkspaceStoreSeo` model — see
 *     that file's header for why this isn't folded into an existing
 *     collection, and why it does NOT depend on `WorkspaceProject`/
 *     `WorkspaceTask`/`WorkspaceAuditLog` the way the crawl-based agents'
 *     persistence does.
 *   - Approved findings generate embedded, self-contained task entries on
 *     the same run document (`agent.generatedTasks`) rather than
 *     `WorkspaceTask` rows — see the model header. Nothing is
 *     auto-applied to the live Store document; a human still has to take
 *     the approved recommendation and apply it via the existing
 *     `updateStore` endpoint (`modules/stores/store.controller.js`), same
 *     "approval creates the work item, a separate step implements it" shape
 *     the other agents already use.
 *   - Logs via `aiCore/logger.service.js#info`/`#warn` rather than
 *     `seoWorkspace/services/auditLog.service.js`, for the same reason
 *     `websiteBuilderSeoAgent`/`blogSeoAgent` already do — see model header.
 */
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

// Finding types the AI may fill in an actual proposedValue for — everything
// else is structural/advisory-only (rationale text, empty proposedValue).
const METADATA_FINDING_TYPES = new Set([
  'missing_seo_title', 'seo_title_too_short', 'seo_title_too_long',
  'missing_seo_description', 'seo_description_too_short', 'seo_description_too_long'
]);

// Deterministic severity per finding type — never AI-assigned, same
// objective-phase discipline as the other agents' severity handling.
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

/**
 * Deterministic length/format validation for an AI-proposed seoTitle or
 * seoDescription value. Same discipline as
 * blogSeoAgent.validateTitleValue/validateMetaDescriptionValue — this is
 * what the human reviewer sees, never derived from the AI's own claims
 * about its output.
 */
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
    // Structural/storefront-completeness finding — advisory rationale only,
    // no value to validate beyond "did the model actually say something".
    return (finding.rationale || '').trim() ? [] : ['Missing rationale for structural finding'];
  }
  if (finding.findingType.startsWith('missing_seo_title') || finding.findingType.startsWith('seo_title')) {
    return validateTitleValue(finding.proposedValue, candidate.currentSeoTitle);
  }
  return validateDescriptionValue(finding.proposedValue, candidate.currentSeoDescription, finding.findingType.startsWith('seo_description') || finding.findingType === 'missing_seo_description' ? candidate.currentSeoTitle : null);
}

/**
 * Phase 1: objective metadata + catalog-completeness signal collection for
 * one Store. No AI involved — every field is either directly read off
 * `store.seoTitle`/`store.seoDescription`/`store.ogImageUrl`/
 * `store.faviconUrl`, or a plain `Product.countDocuments` query against this
 * store's own products, never AI-guessed.
 *
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

/**
 * Builds the eligible finding-type list purely from Phase 1's deterministic
 * signals — the hallucination guard Phase 2's prompt (and its later
 * validation) is restricted to, same "only propose for what was actually
 * measured" discipline as the other agents' equivalent step.
 */
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
 * Phase 2: the actual agent step. Own prompt; proposes a new
 * seoTitle/seoDescription for metadata findings and a short rationale for
 * storefront-completeness findings, restricted to only the finding types
 * Phase 1 flagged. Every returned finding is then run through deterministic
 * validation.
 *
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
 * Full agent run: collect + generate + validate + persist as a new
 * WorkspaceStoreSeo document with approvalStatus 'Pending Approval' (or
 * 'Not Requested' if no findings were generated). Serialized per-store
 * through Execution Queue under its own key, distinct from the other ten
 * agents' keys.
 *
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
 * Human Approval Gate — approve path. Only 'Pending Approval' runs for this
 * store can be approved. Generates one embedded task per valid finding (see
 * model header for why these are embedded, not `WorkspaceTask` rows) —
 * invalid findings are surfaced for manual review instead of silently
 * turned into a task.
 *
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

/**
 * Shared Memory write-side: when a run's findings are rejected, record why
 * (if a reason was given) per finding, so future generation prompts carry
 * that context — e.g. "don't touch this store's SEO title again, marketing
 * signed off on it". Best-effort — a memory-write failure must never break
 * rejection. Same pattern as blogSeoAgent.recordRejectedFindingsIfAny /
 * websiteBuilderSeoAgent.recordRejectedFindingsIfAny.
 */
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
 * Own execution history, read-side. Same shape as the other ten agents'
 * equivalent — queries aiCore's ExecutionLog for both this agent's
 * run-level entries and its underlying AI-call entries. Uses `storeId` as
 * the lookup key against ExecutionLog's `projectId` field — that field is a
 * loose, unenforced ObjectId (see logExecution's usage above), same safe
 * reuse blogSeoAgent/websiteBuilderSeoAgent already rely on for their
 * postId/pageId.
 *
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
