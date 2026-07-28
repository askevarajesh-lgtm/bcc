/**
 * Website Builder SEO Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * A ninth agent alongside the eight already in this module
 * (seoAuditorAgent, keywordResearchAgent, competitorAgent,
 * technicalSeoAgent, contentAgent, schemaAgent, internalLinkingAgent,
 * imageSeoAgent) — but a deliberately different target: those eight all
 * analyze a *live, crawlable domain* tracked as a `WorkspaceProject` (SEO
 * Workspace). This agent analyzes a Website Builder `Page` document
 * directly — a GrapesJS-authored page that is frequently still `Draft`
 * status and has never been published/crawled, so on-page metadata
 * problems (missing/duplicate `<title>`, missing meta description, broken
 * heading hierarchy, thin content) would otherwise go undetected until
 * after publish. `technicalSeoAgent`/`seoAuditorAgent` cannot see this —
 * they only ever look at what a live crawl returns.
 *
 * Same two-phase shape as the other eight agents:
 *   1. collectPageSeoSignals() – gathers OBJECTIVE metadata/structure
 *      signals for one Page: its `<title>`/meta description/canonical
 *      (parsed out of `page.customHeadCode` — the field the builder
 *      already uses for exactly this purpose; see `updatePage` in
 *      website.controller.js), its heading sequence and H1 count (parsed
 *      out of `page.html`), its visible word count, and — via a plain
 *      deterministic comparison against this page's sibling pages on the
 *      same website — whether its title/meta description duplicates
 *      another page's. Every flag is a deterministic, code-level check;
 *      no AI involved, same "objective phase" discipline the other
 *      agents' Phase 1 already follows.
 *   2. generateOnPageSeoFindings() – the actual "agent" step: an AI call
 *      with this agent's own prompt (builder-onpage-metadata-optimization
 *      + builder-heading-structure-audit skills) proposes a new title/meta
 *      description for metadata findings and a short rationale for
 *      structural findings, restricted to only the finding types Phase 1
 *      actually flagged for this page. Every returned finding is then run
 *      through deterministic, code-level validation (findingType must be
 *      one Phase 1 actually flagged, title/description length + no
 *      duplication of the current bad value, no metadata value proposed
 *      for a structural-only finding type) so a human reviewer isn't
 *      relying on the model's self-grading of its own output. Results sit
 *      behind the same human-approval gate pattern as the other agents
 *      (WebsiteBuilderSeo.agent.approvalStatus) before any task is
 *      generated from them.
 *
 * Reuse decisions (nothing here is new infra beyond what's noted):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution) —
 *     the exact same generic infra the other eight agents use. AI Core's
 *     own README documents it as reusable "beyond the SEO Workspace
 *     module" — this agent is that first cross-domain consumer.
 *   - Heading/metadata parsing reuses `cheerio` (already a dependency,
 *     the same library `websites/website.chrome.js` already uses to parse
 *     header/footer out of `page.html`) rather than writing a second HTML
 *     parser.
 *   - Runs for the same page are serialized through aiCore's
 *     executionQueue under a distinct key so a run never blocks (or is
 *     blocked by) the other eight agents, or another run for a different
 *     page.
 *   - Shared memory: recalled before generation (so a prior "don't touch
 *     the title on the /pricing page again, legal signed off on it" note
 *     steers the AI away from repeating a rejected suggestion); written to
 *     when a run's findings are rejected — same pattern as
 *     imageSeoAgent.recordExcludedImagesIfAny /
 *     internalLinkingAgent.recordExcludedLinksIfAny. Scoped by `agencyId`
 *     (required by `WorkspaceMemory`) with this page's *website* id passed
 *     as the memory's `projectId` field — that field is a loose,
 *     unenforced ref used purely for filtering (see sharedMemory.service.js
 *     — `recall()`'s `.populate()` path is never invoked on it), so this is
 *     safe reuse, not a real `WorkspaceProject` dependency.
 *   - Persists its own run output to a new `WebsiteBuilderSeo` model — see
 *     that file's header for why this isn't folded into an existing
 *     collection, and why it does NOT depend on `WorkspaceProject`/
 *     `WorkspaceTask` the way the other eight agents' persistence does.
 *   - Approved findings generate embedded, self-contained task entries on
 *     the same run document (`agent.generatedTasks`) rather than
 *     `WorkspaceTask` rows — see the model header. Nothing is
 *     auto-applied to the live Page document; a human still has to take
 *     the approved recommendation and apply it via the existing
 *     `updatePage` endpoint, same "approval creates the work item, a
 *     separate step implements it" shape the other agents already use for
 *     WordPress publish via `publishGate.service.js`.
 */
const cheerio = require('cheerio');
const Website = require('../../websites/website.model');
const Page = require('../../websites/page.model');
const WebsiteBuilderSeo = require('../models/websiteBuilderSeo.model');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'website-builder-seo-agent';
const TAG = 'WebsiteBuilderSeoAgent';

const VALID_FINDING_TYPES = [
  'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
  'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description',
  'missing_h1', 'multiple_h1', 'skipped_heading_level', 'thin_content', 'missing_canonical'
];

// Finding types the AI may fill in an actual proposedValue for — everything
// else is structural/advisory-only (rationale text, empty proposedValue).
const METADATA_FINDING_TYPES = new Set([
  'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
  'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description'
]);

// Deterministic severity per finding type — never AI-assigned, same
// objective-phase discipline as the crawl-based agents' severity handling.
const SEVERITY_BY_FINDING_TYPE = {
  missing_title: 'high',
  missing_meta_description: 'high',
  missing_h1: 'high',
  multiple_h1: 'high',
  title_too_short: 'medium',
  title_too_long: 'medium',
  duplicate_title: 'medium',
  meta_description_too_short: 'medium',
  meta_description_too_long: 'medium',
  duplicate_meta_description: 'medium',
  skipped_heading_level: 'low',
  missing_canonical: 'low',
  thin_content: 'low'
};

const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const META_DESCRIPTION_MIN_LENGTH = 70;
const META_DESCRIPTION_MAX_LENGTH = 160;
const THIN_CONTENT_WORD_THRESHOLD = 150;
const MAX_SIBLING_PAGES_SCANNED = 200; // small builder sites — not a full-site crawl

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Deterministic length/format validation for an AI-proposed title or meta
 * description value. Same discipline as imageSeoAgent's
 * validateAltTextValue/validateFilenameSlugValue — this is what the human
 * reviewer sees, never derived from the AI's own claims about its output.
 */
function validateTitleValue(value, currentValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed title is empty'); return errors; }
  if (trimmed.length > TITLE_MAX_LENGTH + 15) errors.push(`Proposed title is far longer than the ${TITLE_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed title is identical to the flagged current title');
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  const stuffed = Object.entries(counts).find(([w, c]) => w.length > 3 && c >= 3);
  if (stuffed) errors.push(`Proposed title repeats "${stuffed[0]}" ${stuffed[1]} times (keyword stuffing)`);
  return errors;
}

function validateMetaDescriptionValue(value, currentValue, titleValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed meta description is empty'); return errors; }
  if (trimmed.length > META_DESCRIPTION_MAX_LENGTH + 30) errors.push(`Proposed meta description is far longer than the ${META_DESCRIPTION_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed meta description is identical to the flagged current description');
  if (titleValue && trimmed.toLowerCase() === titleValue.trim().toLowerCase()) errors.push('Proposed meta description just restates the title');
  return errors;
}

function validateFinding(finding, candidate) {
  if (!METADATA_FINDING_TYPES.has(finding.findingType)) {
    // Structural finding — advisory rationale only, no value to validate
    // beyond "did the model actually say something".
    return (finding.rationale || '').trim() ? [] : ['Missing rationale for structural finding'];
  }
  if (finding.findingType.startsWith('title') || finding.findingType === 'duplicate_title') {
    return validateTitleValue(finding.proposedValue, candidate.currentTitleTag);
  }
  return validateMetaDescriptionValue(finding.proposedValue, candidate.currentMetaDescription, finding.proposedValue && finding.findingType.startsWith('meta') ? candidate.currentTitleTag : null);
}

/**
 * Parses `<title>`/`<meta name="description">`/canonical out of
 * `customHeadCode` — the field the builder already uses for exactly this
 * purpose (see `updatePage`). Fragment-safe: `customHeadCode` is a snippet,
 * not a full document, so it's loaded without cheerio's implied
 * html/head/body wrapper affecting tag lookup.
 */
function parseHeadMeta(customHeadCode) {
  const result = { title: '', metaDescription: '', canonical: '' };
  if (!customHeadCode) return result;
  try {
    const $ = cheerio.load(customHeadCode, null, false);
    result.title = ($('title').first().text() || '').trim();
    result.metaDescription = ($('meta[name="description"]').first().attr('content') || '').trim();
    result.canonical = ($('link[rel="canonical"]').first().attr('href') || '').trim();
  } catch (error) {
    logger.warn(TAG, `Failed to parse customHeadCode: ${error.message}`);
  }
  return result;
}

/**
 * Parses heading sequence, H1 texts, image count, and visible word count
 * out of `page.html` — the actual builder canvas markup.
 */
function parseBodySignals(html) {
  const result = { h1Texts: [], headingSequence: [], wordCount: 0 };
  if (!html) return result;
  try {
    const $ = cheerio.load(html);
    const body = $('body').length ? $('body') : $.root();

    body.find(HEADING_TAGS.join(', ')).each((_, el) => {
      const tag = el.tagName ? el.tagName.toLowerCase() : el.name;
      if (!HEADING_TAGS.includes(tag)) return;
      result.headingSequence.push(tag);
      if (tag === 'h1') result.h1Texts.push($(el).text().trim());
    });

    const bodyClone = body.clone();
    bodyClone.find('script, style, noscript').remove();
    const text = bodyClone.text().replace(/\s+/g, ' ').trim();
    result.wordCount = text.length ? text.split(' ').length : 0;
  } catch (error) {
    logger.warn(TAG, `Failed to parse page html: ${error.message}`);
  }
  return result;
}

function headingSequenceSkipsLevel(headingSequence) {
  let maxSeen = 0;
  for (const tag of headingSequence) {
    const level = Number(tag.slice(1));
    if (level > maxSeen + 1) return true;
    if (level > maxSeen) maxSeen = level;
  }
  return false;
}

/**
 * Phase 1: objective metadata + structure signal collection for one Page.
 * No AI involved — every field is either directly parsed off
 * `page.customHeadCode`/`page.html`, or a plain string-equality comparison
 * against this page's sibling pages, never AI-guessed.
 *
 * @param {Object} page - a Page document
 * @param {Object} website - the owning Website document
 * @returns {Promise<Object>} signals matching WebsiteBuilderSeo.inputs
 */
async function collectPageSeoSignals(page, website) {
  const head = parseHeadMeta(page.customHeadCode);
  const body = parseBodySignals(page.html);

  const siblings = await Page.find({
    websiteId: website._id,
    _id: { $ne: page._id },
    isDeleted: false
  }).select('_id customHeadCode').limit(MAX_SIBLING_PAGES_SCANNED).lean();

  let duplicateTitleOfPageId = null;
  let duplicateMetaDescriptionOfPageId = null;
  if (head.title || head.metaDescription) {
    for (const sibling of siblings) {
      const siblingHead = parseHeadMeta(sibling.customHeadCode);
      if (!duplicateTitleOfPageId && head.title && siblingHead.title && siblingHead.title.toLowerCase() === head.title.toLowerCase()) {
        duplicateTitleOfPageId = sibling._id;
      }
      if (!duplicateMetaDescriptionOfPageId && head.metaDescription && siblingHead.metaDescription
        && siblingHead.metaDescription.toLowerCase() === head.metaDescription.toLowerCase()) {
        duplicateMetaDescriptionOfPageId = sibling._id;
      }
      if (duplicateTitleOfPageId && duplicateMetaDescriptionOfPageId) break;
    }
  }

  return {
    path: page.path,
    pageTitle: page.title,
    currentTitleTag: head.title,
    currentMetaDescription: head.metaDescription,
    currentCanonical: head.canonical,
    h1Count: body.h1Texts.length,
    h1Texts: body.h1Texts,
    headingSequence: body.headingSequence,
    skippedHeadingLevel: headingSequenceSkipsLevel(body.headingSequence),
    wordCount: body.wordCount,
    duplicateTitleOfPageId,
    duplicateMetaDescriptionOfPageId,
    dataSource: 'builder'
  };
}

/**
 * Builds the eligible finding-type list purely from Phase 1's deterministic
 * signals — the hallucination guard Phase 2's prompt (and its later
 * validation) is restricted to, same "only propose for what was actually
 * measured" discipline as the other agents' candidate-building step.
 */
function buildEligibleFindingTypes(signals) {
  const eligible = [];

  if (!signals.currentTitleTag) eligible.push('missing_title');
  else if (signals.currentTitleTag.length < TITLE_MIN_LENGTH) eligible.push('title_too_short');
  else if (signals.currentTitleTag.length > TITLE_MAX_LENGTH) eligible.push('title_too_long');
  if (signals.duplicateTitleOfPageId) eligible.push('duplicate_title');

  if (!signals.currentMetaDescription) eligible.push('missing_meta_description');
  else if (signals.currentMetaDescription.length < META_DESCRIPTION_MIN_LENGTH) eligible.push('meta_description_too_short');
  else if (signals.currentMetaDescription.length > META_DESCRIPTION_MAX_LENGTH) eligible.push('meta_description_too_long');
  if (signals.duplicateMetaDescriptionOfPageId) eligible.push('duplicate_meta_description');

  if (signals.h1Count === 0) eligible.push('missing_h1');
  if (signals.h1Count > 1) eligible.push('multiple_h1');
  if (signals.skippedHeadingLevel) eligible.push('skipped_heading_level');
  if (signals.wordCount < THIN_CONTENT_WORD_THRESHOLD) eligible.push('thin_content');
  if (!signals.currentCanonical) eligible.push('missing_canonical');

  return eligible;
}

/**
 * Phase 2: the actual agent step. Own prompt; proposes a new title/meta
 * description for metadata findings and a short rationale for structural
 * findings, restricted to only the finding types Phase 1 flagged. Every
 * returned finding is then run through deterministic validation.
 *
 * @param {Object} website
 * @param {Object} page
 * @param {Object} signals - from collectPageSeoSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, findings: Array }>}
 */
async function generateOnPageSeoFindings(website, page, signals, workspaceId) {
  const eligibleFindingTypes = buildEligibleFindingTypes(signals);
  if (eligibleFindingTypes.length === 0) {
    return { summary: 'No on-page metadata or heading-structure issues were found for this page.', findings: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: website._id });

  const prompt = `You are the Website Builder SEO Agent for the page "${page.title}" (${page.path}) on the website "${website.name}". Propose recommendations ONLY for the finding type(s) listed below — do not propose a finding type that isn't listed, and do not invent one.

Eligible finding types for this page: ${JSON.stringify(eligibleFindingTypes)}

Current measured state (grounded in what was actually parsed off this page — do not invent content beyond this):
${JSON.stringify({
    path: signals.path,
    pageTitle: signals.pageTitle,
    currentTitleTag: signals.currentTitleTag,
    currentMetaDescription: signals.currentMetaDescription,
    currentCanonical: signals.currentCanonical,
    h1Texts: signals.h1Texts,
    headingSequence: signals.headingSequence,
    wordCount: signals.wordCount
  }, null, 2)}
${skillsBlock}
${memoryBlock}

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was generated and why",
  "findings": [
    {
      "findingType": "must be one of the eligible finding types listed above",
      "currentValue": "the current title/meta description, empty string if none or not applicable",
      "proposedValue": "for missing_title/title_too_short/title_too_long/duplicate_title: a new title (30-60 chars). For missing_meta_description/meta_description_too_short/meta_description_too_long/duplicate_meta_description: a new meta description (70-160 chars). For every other finding type: empty string.",
      "rationale": "1-2 sentence justification grounded in the measured state given"
    }
  ]
}
One finding object per eligible finding type. Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: page._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 1500,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI on-page-seo-generation JSON for page ${page._id}: ${error.message}`, { projectId: page._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', findings: [] };
  }

  const candidate = {
    currentTitleTag: signals.currentTitleTag,
    currentMetaDescription: signals.currentMetaDescription
  };

  const generated = (Array.isArray(parsed.findings) ? parsed.findings : [])
    .filter((f) => f.findingType && VALID_FINDING_TYPES.includes(f.findingType) && eligibleFindingTypes.includes(f.findingType))
    .map((f) => {
      const validationErrors = validateFinding(f, candidate);
      return {
        findingType: f.findingType,
        severity: SEVERITY_BY_FINDING_TYPE[f.findingType],
        currentValue: f.currentValue || (METADATA_FINDING_TYPES.has(f.findingType) ? (f.findingType.startsWith('title') || f.findingType === 'duplicate_title' ? candidate.currentTitleTag : candidate.currentMetaDescription) : '') || '',
        proposedValue: METADATA_FINDING_TYPES.has(f.findingType) ? (f.proposedValue || '') : '',
        rationale: (f.rationale || '') + (validationErrors.length ? ` [VALIDATION: ${validationErrors.join('; ')}]` : ''),
        isValid: validationErrors.length === 0
      };
    });

  return { summary: parsed.summary || '', findings: generated };
}

/**
 * Full agent run: collect + generate + validate + persist as a new
 * WebsiteBuilderSeo document with approvalStatus 'Pending Approval' (or
 * 'Not Requested' if no findings were generated). Serialized per-page
 * through Execution Queue under its own key, distinct from the other
 * eight agents' project-scoped keys.
 *
 * @param {string} pageId
 * @param {string} websiteId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WebsiteBuilderSeo document
 */
async function run(pageId, websiteId, workspaceId) {
  const website = await Website.findOne({ _id: websiteId, isDeleted: false });
  if (!website) throw new Error('Website not found');

  const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
  if (!page) throw new Error('Page not found');

  const agencyId = workspaceId || website.workspaceId || website.createdBy;

  return executionQueue.run(`website-builder-seo-agent:${pageId}`, async () => {
    const executionId = `websiteBuilderSeoAgent:${pageId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'websiteBuilderSeoAgent', agentKey: AGENT_KEY, projectId: pageId, status: 'started' });

    try {
      const signals = await collectPageSeoSignals(page, website);
      const { summary, findings } = await generateOnPageSeoFindings(website, page, signals, agencyId);

      const savedRun = await WebsiteBuilderSeo.create({
        websiteId: website._id,
        pageId: page._id,
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
        executionId, source: 'websiteBuilderSeoAgent', agentKey: AGENT_KEY, projectId: pageId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { runId: savedRun._id, findingCount: findings.length, invalidCount: findings.filter((f) => !f.isValid).length }
      });

      return savedRun;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'websiteBuilderSeoAgent', agentKey: AGENT_KEY, projectId: pageId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * Human Approval Gate — approve path. Only 'Pending Approval' runs for
 * this page can be approved. Generates one embedded task per valid
 * finding (see model header for why these are embedded, not
 * `WorkspaceTask` rows) — invalid findings are surfaced for manual review
 * instead of silently turned into a task.
 *
 * @param {string} runId
 * @param {string} pageId
 * @param {string} userId
 */
async function approveFindings(runId, pageId, userId) {
  const run = await WebsiteBuilderSeo.findOne({ _id: runId, pageId });
  if (!run) throw new Error('Website Builder SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Findings must be 'Pending Approval' to approve. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Approved';
  run.agent.approvedBy = userId;
  run.agent.approvedAt = new Date();
  run.agent.rejectionReason = null;

  const taskTypeByFindingType = {
    missing_title: 'Update Meta Tags', title_too_short: 'Update Meta Tags', title_too_long: 'Update Meta Tags', duplicate_title: 'Update Meta Tags',
    missing_meta_description: 'Update Meta Tags', meta_description_too_short: 'Update Meta Tags', meta_description_too_long: 'Update Meta Tags', duplicate_meta_description: 'Update Meta Tags',
    missing_h1: 'Fix Heading Structure', multiple_h1: 'Fix Heading Structure', skipped_heading_level: 'Fix Heading Structure',
    missing_canonical: 'Add Canonical Tag',
    thin_content: 'Expand Thin Content'
  };

  run.agent.generatedTasks = (run.agent.findings || [])
    .filter((f) => f.isValid)
    .map((f) => ({
      taskType: taskTypeByFindingType[f.findingType],
      description: `[Website Builder SEO Agent] ${f.findingType.replace(/_/g, ' ')} on ${run.inputs.path}${f.proposedValue ? `: "${f.proposedValue}"` : ` — ${f.rationale}`}`,
      proposedChanges: { findingType: f.findingType, currentValue: f.currentValue, proposedValue: f.proposedValue, rationale: f.rationale },
      status: 'Pending'
    }));

  await run.save();

  logger.info(TAG, `Findings approved for page ${pageId}`, { runId, pageId, userId, taskCount: run.agent.generatedTasks.length });

  return { run, createdTasks: run.agent.generatedTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectFindings(runId, pageId, userId, reason) {
  const run = await WebsiteBuilderSeo.findOne({ _id: runId, pageId });
  if (!run) throw new Error('Website Builder SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Findings must be 'Pending Approval' to reject. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Rejected';
  run.agent.rejectionReason = reason || null;
  await run.save();

  logger.info(TAG, `Findings rejected for page ${pageId}`, { runId, pageId, userId, reason });

  await recordRejectedFindingsIfAny(run, userId, reason);

  return run;
}

/**
 * Shared Memory write-side: when a run's findings are rejected, record why
 * (if a reason was given) per finding, so future generation prompts carry
 * that context — e.g. "don't touch the title on /pricing again, legal
 * signed off on it". Best-effort — a memory-write failure must never break
 * rejection. Same pattern as imageSeoAgent.recordExcludedImagesIfAny /
 * internalLinkingAgent.recordExcludedLinksIfAny.
 */
async function recordRejectedFindingsIfAny(run, userId, reason) {
  try {
    const findings = run.agent?.findings || [];
    if (findings.length === 0) return;

    const agencyId = run.agencyId || userId;

    for (const f of findings.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId: run.websiteId,
        title: `Rejected on-page SEO finding: ${f.findingType} on ${run.inputs.path}`,
        description: `The Website Builder SEO Agent's ${f.findingType} finding for page ${run.inputs.path} was rejected.`,
        content: reason
          ? `Do not propose ${f.findingType} for page ${run.inputs.path} again. Reason given: ${reason}`
          : `Do not propose ${f.findingType} for page ${run.inputs.path} again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record rejected-finding memory for page ${run.pageId}: ${error.message}`, { pageId: run.pageId });
  }
}

/**
 * Own execution history, read-side. Same shape as the other eight agents'
 * equivalent — queries aiCore's ExecutionLog for both this agent's
 * run-level entries and its underlying AI-call entries. Uses `pageId` as
 * the lookup key against ExecutionLog's `projectId` field — that field is
 * a loose, unenforced ObjectId (see logExecution's usage above), so this
 * is safe reuse rather than a semantic mismatch that breaks anything.
 *
 * @param {string} pageId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(pageId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId: pageId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'websiteBuilderSeoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectPageSeoSignals,
  generateOnPageSeoFindings,
  validateTitleValue,
  validateMetaDescriptionValue,
  approveFindings,
  rejectFindings,
  getExecutionHistory
};
