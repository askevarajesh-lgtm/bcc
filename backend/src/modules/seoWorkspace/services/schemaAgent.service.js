/**
 * Schema Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Same two-phase shape as the other five agents in this module
 * (seoAuditorAgent, keywordResearchAgent, competitorAgent,
 * technicalSeoAgent, contentAgent):
 *   1. collectPageSignals() – gathers OBJECTIVE per-page data via a light
 *      CrawlService pass (URL, title, meta description, H1, word count,
 *      indexability). No AI involved, no schema-type judgment made here —
 *      that classification requires semantic judgment and belongs in
 *      Phase 2, same reasoning competitorAgent/technicalSeoAgent use for
 *      keeping "judgment" out of their objective-collection phase.
 *   2. generateSchemaMarkup() – the actual "agent" step: an AI call with
 *      this agent's own prompt (schema-markup-generation +
 *      schema-validation skills) picks a page type per crawled page and
 *      produces JSON-LD structured data for it. The AI's own output is
 *      then run through validateSchemaMarkup() — a deterministic,
 *      code-level required/recommended-property check per @type — so a
 *      human reviewer isn't relying on the model's self-grading of its own
 *      markup. Results sit behind the same human-approval gate pattern as
 *      the other agents (WorkspaceSchemaMarkup.agent.approvalStatus)
 *      before any WorkspaceTask is generated from them.
 *
 * Reuse decisions (nothing here is new infra beyond what's noted):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - The page-signal pass reuses `CrawlService` (same one seoAuditorAgent/
 *     technicalSeoAgent/contentAgent already use) rather than writing a
 *     second crawler — a small page limit, since this agent only needs
 *     title/meta/H1/word-count per page, not a full content crawl.
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue under a distinct key so a schema-agent run never
 *     blocks (or is blocked by) the other five agents for the same
 *     project.
 *   - Shared memory: recalled before generation (so a prior "this site has
 *     no physical location, never propose LocalBusiness" note steers the
 *     AI away from repeating a rejected type); written to when a page's
 *     schema is rejected, same pattern as competitorAgent's
 *     recordExcludedCompetitorsIfAny.
 *   - Approved pages generate WorkspaceTask entries using the existing
 *     taskType enum's 'Schema Injection' value — no schema change to
 *     WorkspaceTask.
 *   - Persists its own run output to a new `WorkspaceSchemaMarkup` model —
 *     see that file's header for why this isn't folded into an existing
 *     collection.
 */
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceSchemaMarkup = require('../models/workspaceSchemaMarkup.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'schema-agent';
const TAG = 'SchemaAgent';

const VALID_PAGE_TYPES = [
  'Article', 'BlogPosting', 'Product', 'FAQPage', 'HowTo',
  'BreadcrumbList', 'WebPage', 'CollectionPage', 'Organization',
  'LocalBusiness', 'WebSite', 'Other'
];
const SCHEMA_CRAWL_PAGE_LIMIT = 15; // small, targeted pass — not a full content crawl
const MAX_PAGES_PER_RUN = 10; // cap how many pages get an AI-generated schema per run

// --- Validation (deterministic, code-level — NOT AI self-grading) -------
//
// Mirrors the schema-validation skill's required/recommended property
// tables. Kept as plain data + a small walker so it's easy to extend if a
// new @type is added later without touching the traversal logic.

const REQUIRED_PROPS = {
  Article: ['headline', 'image'],
  BlogPosting: ['headline', 'image'],
  NewsArticle: ['headline', 'image'],
  Product: ['name'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address'],
  WebSite: ['url']
};

const RECOMMENDED_PROPS = {
  Article: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  BlogPosting: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  NewsArticle: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  Product: ['image', 'description', 'brand', 'sku'],
  Organization: ['logo', 'sameAs'],
  LocalBusiness: ['telephone', 'geo']
};

const RICH_RESULT_LABELS = {
  Article: 'Article rich result',
  BlogPosting: 'Article rich result',
  NewsArticle: 'Article rich result',
  Product: 'Product snippet',
  FAQPage: 'FAQ rich result (note: largely limited to authoritative gov/health sites)',
  HowTo: 'HowTo rich result',
  BreadcrumbList: 'Breadcrumb rich result',
  WebSite: 'Sitelinks search box',
  Organization: 'Knowledge panel / entity signal',
  LocalBusiness: 'Local Business rich result'
};

function isEmptyValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function extractNodes(jsonLd) {
  if (!jsonLd || typeof jsonLd !== 'object') return [];
  if (Array.isArray(jsonLd['@graph'])) return jsonLd['@graph'];
  return [jsonLd];
}

function validateNode(node) {
  const errors = [];
  const warnings = [];
  const richResults = [];

  const rawType = node['@type'];
  const types = (Array.isArray(rawType) ? rawType : [rawType]).filter(Boolean);

  types.forEach((type) => {
    (REQUIRED_PROPS[type] || []).forEach((prop) => {
      if (isEmptyValue(node[prop])) errors.push(`${type}: missing required property "${prop}"`);
    });
    (RECOMMENDED_PROPS[type] || []).forEach((prop) => {
      if (isEmptyValue(node[prop])) warnings.push(`${type}: missing recommended property "${prop}"`);
    });
    if (RICH_RESULT_LABELS[type]) richResults.push(`${type}: ${RICH_RESULT_LABELS[type]}`);

    if (type === 'Product') {
      if (isEmptyValue(node.offers) && isEmptyValue(node.review) && isEmptyValue(node.aggregateRating)) {
        errors.push('Product: must include at least one of "offers", "review", or "aggregateRating"');
      } else if (node.offers && !Array.isArray(node.offers)) {
        ['price', 'priceCurrency', 'availability'].forEach((prop) => {
          if (isEmptyValue(node.offers[prop])) errors.push(`Product.offers: missing required property "${prop}"`);
        });
      }
    }

    if (type === 'FAQPage') {
      const entities = Array.isArray(node.mainEntity) ? node.mainEntity : [];
      entities.forEach((question, i) => {
        if (isEmptyValue(question?.name)) errors.push(`FAQPage.mainEntity[${i}]: missing required property "name"`);
        if (!question?.acceptedAnswer || isEmptyValue(question.acceptedAnswer.text)) {
          errors.push(`FAQPage.mainEntity[${i}]: missing required property "acceptedAnswer.text"`);
        }
      });
    }

    if (type === 'HowTo') {
      const steps = Array.isArray(node.step) ? node.step : [];
      steps.forEach((step, i) => {
        if (isEmptyValue(step?.text)) errors.push(`HowTo.step[${i}]: missing required property "text"`);
      });
    }

    if (type === 'BreadcrumbList') {
      const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
      items.forEach((item, i) => {
        if (isEmptyValue(item?.position)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "position"`);
        if (isEmptyValue(item?.name)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "name"`);
        const isLast = i === items.length - 1;
        if (!isLast && isEmptyValue(item?.item)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "item"`);
      });
    }

    if (type === 'LocalBusiness') {
      const address = node.address || {};
      ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'].forEach((prop) => {
        if (isEmptyValue(address[prop])) errors.push(`LocalBusiness.address: missing required property "${prop}"`);
      });
    }

    if (type === 'WebSite' && node.potentialAction) {
      const action = node.potentialAction;
      if (action['@type'] === 'SearchAction' && !String(action.target || '').includes('{search_term_string}')) {
        errors.push('WebSite.potentialAction: SearchAction "target" must contain "{search_term_string}"');
      }
    }
  });

  return { errors, warnings, richResults };
}

/**
 * Deterministic validation entry point — walks every node in the JSON-LD
 * (a single object, or an `@graph` array of nodes) and aggregates errors/
 * warnings/rich-result eligibility across all of them. This is what the
 * Human Approval Gate's reviewer sees; it is never derived from the AI's
 * own claims about its output.
 *
 * @param {Object} jsonLd
 * @returns {{ isValid: boolean, errors: string[], warnings: string[], richResultEligibility: string[] }}
 */
function validateSchemaMarkup(jsonLd) {
  const nodes = extractNodes(jsonLd);
  if (nodes.length === 0) {
    return { isValid: false, errors: ['No JSON-LD node found to validate'], warnings: [], richResultEligibility: [] };
  }

  const errors = [];
  const warnings = [];
  const richResultEligibility = [];

  nodes.forEach((node) => {
    if (!node || typeof node !== 'object' || !node['@type']) {
      errors.push('A JSON-LD node is missing "@type"');
      return;
    }
    const result = validateNode(node);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    result.richResults.forEach((label) => {
      if (!richResultEligibility.includes(label)) richResultEligibility.push(label);
    });
  });

  return { isValid: errors.length === 0, errors, warnings, richResultEligibility };
}

/**
 * Phase 1: objective page-signal collection. No AI involved, no schema
 * type judgment made — every field is either directly measured by the
 * crawl or left at a neutral default (never fabricated).
 *
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ pages: Array, dataSource: string }>}
 */
async function collectPageSignals(project) {
  const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;

  const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, SCHEMA_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
    .catch((error) => {
      logger.warn(TAG, `Page-signal crawl failed for ${rootUrl}, continuing with an empty page set: ${error.message}`, { projectId: project._id });
      return { pages: [] };
    });

  const pages = (crawlResult.pages || [])
    .filter((p) => p.status === 200 && p.indexable !== false)
    .map((p) => ({
      url: p.final_url || p.url,
      title: p.title || '',
      metaDescription: p.meta_description || '',
      h1: p.h1 || '',
      wordCount: p.word_count || 0,
      indexable: p.indexable !== false
    }));

  return { pages, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

/**
 * Phase 2: the actual agent step. Own prompt; picks a page type per
 * crawled page and produces JSON-LD for it, then runs every returned
 * payload through validateSchemaMarkup(). Guards against a hallucinated
 * pageUrl or pageType outside what was actually provided/allowed.
 *
 * @param {Object} project
 * @param {Array} pages - from collectPageSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, pages: Array }>}
 */
async function generateSchemaMarkup(project, pages, workspaceId) {
  if (pages.length === 0) {
    return { summary: 'No indexable pages were available to generate structured data for.', pages: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const candidatePages = pages.slice(0, MAX_PAGES_PER_RUN);

  const prompt = `You are the Schema Agent for ${project.name} (${project.domain}). Generate JSON-LD structured data for each of the pages below, based only on what's actually given — do not invent content that isn't reflected in the page's title/meta description/H1.

Pages (word counts of 0 mean the crawl couldn't read body content — treat conservatively):
${JSON.stringify(candidatePages, null, 2)}
${skillsBlock}
${memoryBlock}

Only propose schema for pages in the list above — do not invent a page URL. Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was generated and why",
  "pages": [
    {
      "pageUrl": "must exactly match one url above",
      "pageType": "Article | BlogPosting | Product | FAQPage | HowTo | BreadcrumbList | WebPage | CollectionPage | Organization | LocalBusiness | WebSite | Other",
      "schemaTypes": ["the @type value(s) actually used in jsonLd, e.g. [\\"BlogPosting\\", \\"BreadcrumbList\\"]"],
      "jsonLd": { "@context": "https://schema.org", "...": "the actual JSON-LD object, or an @graph array of nodes" },
      "rationale": "1-2 sentence justification grounded in the page signals given"
    }
  ]
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 2500,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI schema-generation JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', pages: [] };
  }

  const candidateUrls = new Set(candidatePages.map((p) => p.url));
  const generatedPages = (Array.isArray(parsed.pages) ? parsed.pages : [])
    .filter((p) => p.pageUrl && candidateUrls.has(p.pageUrl) && p.jsonLd && typeof p.jsonLd === 'object')
    .slice(0, MAX_PAGES_PER_RUN)
    .map((p) => {
      const validation = validateSchemaMarkup(p.jsonLd);
      return {
        pageUrl: p.pageUrl,
        pageType: VALID_PAGE_TYPES.includes(p.pageType) ? p.pageType : 'Other',
        schemaTypes: Array.isArray(p.schemaTypes) ? p.schemaTypes.slice(0, 5).map(String) : [],
        jsonLd: p.jsonLd,
        validation,
        rationale: p.rationale || ''
      };
    });

  return { summary: parsed.summary || '', pages: generatedPages };
}

/**
 * Full agent run: collect + generate + validate + persist as a new
 * WorkspaceSchemaMarkup document with approvalStatus 'Pending Approval'
 * (or 'Not Requested' if no pages were generated). Serialized per-project
 * through Execution Queue under its own key, distinct from the other five
 * agents' keys.
 *
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceSchemaMarkup document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`schema-agent:${projectId}`, async () => {
    const executionId = `schemaAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'schemaAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { pages: pageSignals, dataSource } = await collectPageSignals(project);
      const { summary, pages } = await generateSchemaMarkup(project, pageSignals, agencyId);

      const markup = await WorkspaceSchemaMarkup.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { pages: pageSignals, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          pages,
          approvalStatus: pages.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'schemaAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { markupId: markup._id, pageCount: pages.length, invalidCount: pages.filter((p) => !p.validation.isValid).length }
      });

      return markup;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'schemaAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * Human Approval Gate — approve path. Only 'Pending Approval' runs for
 * this project can be approved. Generates one WorkspaceTask per generated
 * page (taskType 'Schema Injection'), same threshold-free approach as
 * contentAgent (every generated page needs the schema injected — there is
 * no severity axis to filter on the way technicalSeoAgent does).
 * Validation errors/warnings are carried into the task description so the
 * implementer knows whether the JSON-LD needs a fix before it ships.
 *
 * @param {string} markupId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveSchemaMarkup(markupId, projectId, userId) {
  const markup = await WorkspaceSchemaMarkup.findOne({ _id: markupId, projectId });
  if (!markup) throw new Error('Schema markup run not found');

  if (!markup.agent || markup.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Schema markup must be 'Pending Approval' to approve. Current status is '${markup.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  markup.agent.approvalStatus = 'Approved';
  markup.agent.approvedBy = userId;
  markup.agent.approvedAt = new Date();
  markup.agent.rejectionReason = null;

  const tasksToCreate = (markup.agent.pages || []).map((p) => ({
    projectId,
    pageUrl: p.pageUrl,
    taskType: 'Schema Injection',
    description: `[Schema Agent] Inject ${p.schemaTypes.join('+') || p.pageType} JSON-LD for ${p.pageUrl}${p.validation?.errors?.length ? ` — ${p.validation.errors.length} validation error(s) to resolve first` : ''}`,
    proposedChanges: { pageType: p.pageType, schemaTypes: p.schemaTypes, jsonLd: p.jsonLd, validation: p.validation },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    markup.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await markup.save();

  auditLogService.record({
    targetType: 'SchemaMarkup', targetId: markup._id, projectId,
    action: 'schema_markup_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { markup, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectSchemaMarkup(markupId, projectId, userId, reason) {
  const markup = await WorkspaceSchemaMarkup.findOne({ _id: markupId, projectId });
  if (!markup) throw new Error('Schema markup run not found');

  if (!markup.agent || markup.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Schema markup must be 'Pending Approval' to reject. Current status is '${markup.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  markup.agent.approvalStatus = 'Rejected';
  markup.agent.rejectionReason = reason || null;
  await markup.save();

  auditLogService.record({
    targetType: 'SchemaMarkup', targetId: markup._id, projectId,
    action: 'schema_markup_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedPagesIfAny(markup, projectId, userId, reason);

  return markup;
}

/**
 * Shared Memory write-side: when a run's schema is rejected, record why
 * (if a reason was given) per page, so future generation prompts carry
 * that context — e.g. "don't propose LocalBusiness for this site, it has
 * no physical location". Best-effort — a memory-write failure must never
 * break rejection. Same pattern as competitorAgent's
 * recordExcludedCompetitorsIfAny.
 */
async function recordExcludedPagesIfAny(markup, projectId, userId, reason) {
  try {
    const pages = markup.agent?.pages || [];
    if (pages.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const page of pages.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Rejected schema: ${page.pageType} for ${page.pageUrl}`,
        description: `The Schema Agent's ${page.pageType} markup for ${page.pageUrl} was rejected.`,
        content: reason
          ? `Do not propose ${page.pageType} schema for ${page.pageUrl} the same way again. Reason given: ${reason}`
          : `Do not propose ${page.pageType} schema for ${page.pageUrl} the same way again.`,
        type: 'excluded_schema'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-schema memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * Own execution history, read-side. Same shape as the other five agents'
 * equivalent — queries aiCore's ExecutionLog for both this agent's
 * run-level entries and its underlying AI-call entries.
 *
 * @param {string} projectId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'schemaAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectPageSignals,
  generateSchemaMarkup,
  validateSchemaMarkup,
  approveSchemaMarkup,
  rejectSchemaMarkup,
  getExecutionHistory
};
