/**
 * Internal Linking Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Same two-phase shape as the other six agents in this module
 * (seoAuditorAgent, keywordResearchAgent, competitorAgent,
 * technicalSeoAgent, contentAgent, schemaAgent):
 *   1. collectLinkGraphSignals() – gathers OBJECTIVE per-page data AND the
 *      same-host link graph via a reused CrawlService pass (URL, title,
 *      meta description, H1, word count, indexability, outbound same-host
 *      links). Inbound link counts and orphan-page status are then derived
 *      deterministically (plain counting, no AI) from that graph — never
 *      AI-estimated, same "objective phase" discipline the other agents'
 *      Phase 1 already follows.
 *   2. generateLinkSuggestions() – the actual "agent" step: an AI call
 *      with this agent's own prompt (internal-linking-strategy +
 *      orphan-page-detection skills) proposes new source→target hyperlinks
 *      with anchor text. Every proposed pair is then run through
 *      deterministic, code-level validation (both URLs must be in the
 *      candidate set, no self-links, no duplicate of an already-existing
 *      or already-suggested pair) so a human reviewer isn't relying on the
 *      model's own claim that a link doesn't already exist. Results sit
 *      behind the same human-approval gate pattern as the other agents
 *      (WorkspaceInternalLink.agent.approvalStatus) before any
 *      WorkspaceTask is generated from them.
 *
 * Reuse decisions (nothing here is new infra beyond what's noted):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - The page + link-graph pass reuses `CrawlService` (same one
 *     seoAuditorAgent/technicalSeoAgent/contentAgent/schemaAgent already
 *     use) rather than writing a second crawler. `CrawlService` previously
 *     discarded each page's outbound-link list before storing it — that
 *     was extended additively (see crawl.service.js's inline comment) so
 *     this agent can build a link graph without a second fetch pass; every
 *     other existing consumer of `crawlResult.pages` only destructures the
 *     specific fields it already used, so this is non-breaking.
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue under a distinct key so an internal-linking run never
 *     blocks (or is blocked by) the other six agents for the same project.
 *   - Shared memory: recalled before generation (so a prior "never link
 *     the archived /old-promo page, it's being retired" note steers the AI
 *     away from repeating a rejected suggestion); written to when a run's
 *     suggestions are rejected, same pattern as schemaAgent's
 *     recordExcludedPagesIfAny / competitorAgent's
 *     recordExcludedCompetitorsIfAny.
 *   - Approved suggestions generate WorkspaceTask entries using the
 *     existing taskType enum's 'Internal Linking' value (already present
 *     on WorkspaceTask, added for exactly this prompt-legal case per that
 *     model's own inline comment) — no schema change to WorkspaceTask.
 *   - Persists its own run output to a new `WorkspaceInternalLink` model —
 *     see that file's header for why this isn't folded into an existing
 *     collection.
 */
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceInternalLink = require('../models/workspaceInternalLink.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'internal-linking-agent';
const TAG = 'InternalLinkingAgent';

const VALID_REASON_CATEGORIES = ['orphan_rescue', 'hub_page_linking', 'topical_relevance'];
const LINKING_CRAWL_PAGE_LIMIT = 30; // wider than schema/technical's 15 — a link graph needs more of the site to be meaningful
const MAX_PAGES_IN_PROMPT = 25; // cap how many pages get sent to the model per run
const MAX_SUGGESTIONS_PER_RUN = 15;
const MAX_NEW_OUTBOUND_LINKS_PER_SOURCE = 3; // mirrors the skill's "don't dump a dozen new links on one page" guidance

function normalizeUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.hash = '';
    // strip a single trailing slash (except for the bare root) so
    // 'https://x.com/about' and 'https://x.com/about/' count as the same
    // page when matching link-graph pairs.
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    return `${u.origin}${pathname}${u.search}`;
  } catch (error) {
    return url;
  }
}

function pairKey(sourceUrl, targetUrl) {
  return `${normalizeUrl(sourceUrl)}=>${normalizeUrl(targetUrl)}`;
}

/**
 * Phase 1: objective page + link-graph collection. No AI involved, no
 * relevance judgment made — inboundLinkCount/isOrphan are plain counts
 * over the crawled pages' own outbound links, never fabricated or
 * AI-guessed.
 *
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ pages: Array, existingLinks: Array, dataSource: string }>}
 */
async function collectLinkGraphSignals(project) {
  const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;
  const normalizedRoot = normalizeUrl(rootUrl);

  const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, LINKING_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
    .catch((error) => {
      logger.warn(TAG, `Link-graph crawl failed for ${rootUrl}, continuing with an empty page set: ${error.message}`, { projectId: project._id });
      return { pages: [] };
    });

  const rawPages = (crawlResult.pages || []).filter((p) => p.status === 200 && p.indexable !== false);
  const crawledUrlSet = new Set(rawPages.map((p) => normalizeUrl(p.final_url || p.url)));

  // Build outbound edges, restricted to pages that were actually crawled
  // (a page can link to a same-host URL that wasn't itself fetched/kept —
  // that edge is not meaningful for inbound-count purposes here).
  const outboundByUrl = new Map();
  const existingLinks = [];
  rawPages.forEach((p) => {
    const from = normalizeUrl(p.final_url || p.url);
    const rawLinks = Array.isArray(p.links) ? p.links : [];
    const toSet = new Set();
    rawLinks.forEach((link) => {
      const to = normalizeUrl(link);
      if (to && to !== from && crawledUrlSet.has(to)) toSet.add(to);
    });
    const outbound = Array.from(toSet);
    outboundByUrl.set(from, outbound);
    outbound.forEach((to) => existingLinks.push({ sourceUrl: from, targetUrl: to }));
  });

  const inboundCounts = new Map();
  existingLinks.forEach(({ targetUrl }) => {
    inboundCounts.set(targetUrl, (inboundCounts.get(targetUrl) || 0) + 1);
  });

  const pages = rawPages.map((p) => {
    const url = normalizeUrl(p.final_url || p.url);
    const inboundLinkCount = inboundCounts.get(url) || 0;
    const isHomepage = url === normalizedRoot;
    return {
      url,
      title: p.title || '',
      metaDescription: p.meta_description || '',
      h1: p.h1 || '',
      wordCount: p.word_count || 0,
      indexable: p.indexable !== false,
      outboundInternalLinks: outboundByUrl.get(url) || [],
      inboundLinkCount,
      isOrphan: !isHomepage && inboundLinkCount === 0
    };
  });

  return { pages, existingLinks, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

/**
 * Phase 2: the actual agent step. Own prompt; proposes new source→target
 * internal links with anchor text, then runs every proposed pair through
 * deterministic validation. Guards against hallucinated URLs, self-links,
 * and duplicates of pairs that already exist or were already suggested.
 *
 * @param {Object} project
 * @param {Array} pages - from collectLinkGraphSignals
 * @param {Array} existingLinks - from collectLinkGraphSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, suggestions: Array }>}
 */
async function generateLinkSuggestions(project, pages, existingLinks, workspaceId) {
  if (pages.length === 0) {
    return { summary: 'No indexable pages were available to analyze for internal linking opportunities.', suggestions: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  // Prioritize orphan pages so they aren't crowded out of the prompt by a
  // large site — the skill requires every orphan in the candidate set to
  // be considered.
  const orphans = pages.filter((p) => p.isOrphan);
  const nonOrphans = pages.filter((p) => !p.isOrphan);
  const candidatePages = [...orphans, ...nonOrphans].slice(0, MAX_PAGES_IN_PROMPT);
  const candidateUrls = new Set(candidatePages.map((p) => p.url));
  const relevantExistingLinks = existingLinks.filter((l) => candidateUrls.has(l.sourceUrl) && candidateUrls.has(l.targetUrl));

  const promptPages = candidatePages.map((p) => ({
    url: p.url,
    title: p.title,
    h1: p.h1,
    metaDescription: p.metaDescription,
    wordCount: p.wordCount,
    inboundLinkCount: p.inboundLinkCount,
    isOrphan: p.isOrphan
  }));

  const prompt = `You are the Internal Linking Agent for ${project.name} (${project.domain}). Propose new internal (same-site) hyperlinks between the pages below, based only on what's actually given — do not invent a page URL that isn't in the list.

Pages (inboundLinkCount/isOrphan are computed from the actual crawled link graph, not your judgment):
${JSON.stringify(promptPages, null, 2)}

Existing source->target links already in place (never propose one of these pairs again):
${JSON.stringify(relevantExistingLinks, null, 2)}
${skillsBlock}
${memoryBlock}

Only propose links between URLs in the page list above — do not invent a sourceUrl or targetUrl. Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was proposed and why, mentioning how many orphan pages were addressed",
  "suggestions": [
    {
      "sourceUrl": "must exactly match one url above — the page that will contain the new link",
      "targetUrl": "must exactly match one url above — the page being linked to",
      "anchorText": "natural, descriptive anchor text, never 'click here' or a raw URL",
      "reasonCategory": "orphan_rescue | hub_page_linking | topical_relevance",
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
    logger.error(TAG, `Failed to parse AI internal-linking JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', suggestions: [] };
  }

  const existingPairKeys = new Set(relevantExistingLinks.map((l) => pairKey(l.sourceUrl, l.targetUrl)));
  const seenPairKeys = new Set();
  const sourceCounts = new Map();

  const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
    .filter((s) => {
      if (!s || !s.sourceUrl || !s.targetUrl || !s.anchorText) return false;
      const source = normalizeUrl(s.sourceUrl);
      const target = normalizeUrl(s.targetUrl);
      if (!candidateUrls.has(source) || !candidateUrls.has(target)) return false; // hallucination guard
      if (source === target) return false; // no self-links
      const key = pairKey(source, target);
      if (existingPairKeys.has(key) || seenPairKeys.has(key)) return false; // no duplicates of real or already-proposed links
      const sourceCount = sourceCounts.get(source) || 0;
      if (sourceCount >= MAX_NEW_OUTBOUND_LINKS_PER_SOURCE) return false; // don't dump too many new links on one page
      seenPairKeys.add(key);
      sourceCounts.set(source, sourceCount + 1);
      return true;
    })
    .slice(0, MAX_SUGGESTIONS_PER_RUN)
    .map((s) => ({
      sourceUrl: normalizeUrl(s.sourceUrl),
      targetUrl: normalizeUrl(s.targetUrl),
      anchorText: String(s.anchorText).slice(0, 200),
      reasonCategory: VALID_REASON_CATEGORIES.includes(s.reasonCategory) ? s.reasonCategory : 'topical_relevance',
      rationale: s.rationale || ''
    }));

  return { summary: parsed.summary || '', suggestions };
}

/**
 * Full agent run: collect + generate + validate + persist as a new
 * WorkspaceInternalLink document with approvalStatus 'Pending Approval'
 * (or 'Not Requested' if no suggestions were generated). Serialized
 * per-project through Execution Queue under its own key, distinct from
 * the other six agents' keys.
 *
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceInternalLink document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`internal-linking-agent:${projectId}`, async () => {
    const executionId = `internalLinkingAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'internalLinkingAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { pages, existingLinks, dataSource } = await collectLinkGraphSignals(project);
      const { summary, suggestions } = await generateLinkSuggestions(project, pages, existingLinks, agencyId);

      const linkRun = await WorkspaceInternalLink.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { pages, existingLinks, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          suggestions,
          approvalStatus: suggestions.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'internalLinkingAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: {
          linkRunId: linkRun._id,
          suggestionCount: suggestions.length,
          orphanPageCount: pages.filter((p) => p.isOrphan).length
        }
      });

      return linkRun;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'internalLinkingAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * Human Approval Gate — approve path. Only 'Pending Approval' runs for
 * this project can be approved. Generates one WorkspaceTask per suggested
 * link (taskType 'Internal Linking'), same threshold-free approach as
 * schemaAgent (every generated suggestion needs the link inserted — there
 * is no severity axis to filter on the way technicalSeoAgent does).
 *
 * @param {string} linkRunId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveLinkSuggestions(linkRunId, projectId, userId) {
  const linkRun = await WorkspaceInternalLink.findOne({ _id: linkRunId, projectId });
  if (!linkRun) throw new Error('Internal linking run not found');

  if (!linkRun.agent || linkRun.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Internal linking suggestions must be 'Pending Approval' to approve. Current status is '${linkRun.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  linkRun.agent.approvalStatus = 'Approved';
  linkRun.agent.approvedBy = userId;
  linkRun.agent.approvedAt = new Date();
  linkRun.agent.rejectionReason = null;

  const tasksToCreate = (linkRun.agent.suggestions || []).map((s) => ({
    projectId,
    pageUrl: s.sourceUrl,
    taskType: 'Internal Linking',
    description: `[Internal Linking Agent] Add a link to ${s.targetUrl} (anchor: "${s.anchorText}") on ${s.sourceUrl} — ${s.reasonCategory.replace(/_/g, ' ')}`,
    proposedChanges: { sourceUrl: s.sourceUrl, targetUrl: s.targetUrl, anchorText: s.anchorText, reasonCategory: s.reasonCategory, rationale: s.rationale },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    linkRun.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await linkRun.save();

  auditLogService.record({
    targetType: 'InternalLink', targetId: linkRun._id, projectId,
    action: 'internal_link_suggestions_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { linkRun, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectLinkSuggestions(linkRunId, projectId, userId, reason) {
  const linkRun = await WorkspaceInternalLink.findOne({ _id: linkRunId, projectId });
  if (!linkRun) throw new Error('Internal linking run not found');

  if (!linkRun.agent || linkRun.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Internal linking suggestions must be 'Pending Approval' to reject. Current status is '${linkRun.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  linkRun.agent.approvalStatus = 'Rejected';
  linkRun.agent.rejectionReason = reason || null;
  await linkRun.save();

  auditLogService.record({
    targetType: 'InternalLink', targetId: linkRun._id, projectId,
    action: 'internal_link_suggestions_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedLinksIfAny(linkRun, projectId, userId, reason);

  return linkRun;
}

/**
 * Shared Memory write-side: when a run's suggestions are rejected, record
 * why (if a reason was given) per pair, so future generation prompts carry
 * that context — e.g. "don't link to the archived /old-promo page, it's
 * being retired". Best-effort — a memory-write failure must never break
 * rejection. Same pattern as schemaAgent's recordExcludedPagesIfAny.
 */
async function recordExcludedLinksIfAny(linkRun, projectId, userId, reason) {
  try {
    const suggestions = linkRun.agent?.suggestions || [];
    if (suggestions.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const s of suggestions.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Rejected internal link: ${s.sourceUrl} -> ${s.targetUrl}`,
        description: `The Internal Linking Agent's suggestion to link ${s.sourceUrl} to ${s.targetUrl} was rejected.`,
        content: reason
          ? `Do not propose linking ${s.sourceUrl} to ${s.targetUrl} again. Reason given: ${reason}`
          : `Do not propose linking ${s.sourceUrl} to ${s.targetUrl} again.`,
        // No dedicated 'excluded_link' type exists on WorkspaceMemory's
        // enum (['best_practice','brand_voice','do_not_do',
        // 'approved_terminology','recurring_issue']). 'do_not_do' is the
        // correct existing fit — NOT 'excluded_schema', which schemaAgent's
        // own equivalent call uses despite that value not being in the
        // enum at all, so every one of *those* memory writes silently
        // fails Mongoose validation and is swallowed by this same
        // try/catch. Using a valid value here so this agent's writes
        // actually persist instead of repeating that bug.
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-link memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * Own execution history, read-side. Same shape as the other six agents'
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'internalLinkingAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectLinkGraphSignals,
  generateLinkSuggestions,
  approveLinkSuggestions,
  rejectLinkSuggestions,
  getExecutionHistory
};
