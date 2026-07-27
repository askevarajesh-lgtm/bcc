/**
 * Keyword Research Agent
 *
 * Own prompt, own service (this file), own execution history, own logs,
 * retry, human approval, shared memory integration. No UI.
 *
 * Mirrors the same two-phase shape as seoAuditorAgent.service.js:
 *   1. collectKeywordCandidates() – gathers objective keyword data
 *      (DataForSEO keyword suggestions/ideas + difficulty), falling back to
 *      AI-generated seed keywords only when DataForSEO isn't configured or
 *      fails.
 *   2. analyzeAndSuggest()        – the actual "agent" step: an AI call
 *      with this agent's own prompt selects and scores the best subset,
 *      with a rationale and theme per keyword. Suggestions sit behind a
 *      human-approval gate (WorkspaceKeyword.status) before they count as
 *      actively tracked — mirroring the SEO Auditor's Gate pattern, applied
 *      here to keyword suggestions instead of audit findings.
 *
 * Relationship to the existing orchestrator:
 *   workspaceAgentOrchestrator.service.js already has its own inline
 *   keyword-fetching step (getRankedKeywords, with an AI-seed fallback).
 *   That step answers "what is this domain already ranking for" — it's
 *   rank tracking, not research. It's also the only place in the codebase
 *   currently generating keyword search-volume data via AI, and it presents
 *   a fabricated random number (`Math.random() * 5000 + 100`) as if it
 *   were a real search-volume metric. This agent does not touch or replace
 *   that code (out of scope for this pass — the instructions call for
 *   waiting for approval before further phases), but its own AI fallback
 *   deliberately does NOT invent numbers; see generateAiKeywordSeeds below.
 *
 * Reuse decisions (same as seoAuditorAgent.service.js):
 *   - AI calls, retries, execution status, and logging go through aiCore
 *     (aiEngine.complete already wraps retry + status + logExecution).
 *   - Raw DataForSEO calls are wrapped with aiCore's retry.service directly.
 *   - Runs for the same project are serialized through aiCore's
 *     executionQueue.
 *   - Shared memory: recalled before analysis (prior approved keyword
 *     themes, do-not-target rules); written to when a keyword theme is
 *     rejected repeatedly, so future runs stop re-suggesting it.
 *   - Suggestions reuse the existing WorkspaceKeyword model/collection —
 *     no new schema — via the additive `source`/`status`/`agent` fields.
 */
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const dataForSeoService = require('../../seoIntelligence/dataForSeo.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'keyword-research';
const TAG = 'KeywordResearchAgent';

const VALID_INTENTS = ['informational', 'navigational', 'commercial', 'transactional', 'unknown'];
const MAX_CANDIDATES = 40;
const MAX_SUGGESTIONS = 15;
const DEFAULT_LOCATION_CODE = 2840; // US, matches WorkspaceKeyword's own default
const DEFAULT_LANGUAGE_CODE = 'en';

/**
 * Phase 1: objective keyword data collection. No AI involved unless
 * DataForSEO is unavailable, in which case it falls back to AI-generated
 * seed keywords (see generateAiKeywordSeeds).
 *
 * @param {Object} project - a WorkspaceProject document
 * @param {string} agencyId
 * @param {string} [seedKeyword] - explicit seed; defaults to the project's name
 * @returns {Promise<Array>} candidate objects: { keyword, searchVolume, cpc, competition, intent, keywordDifficulty }
 */
async function collectKeywordCandidates(project, agencyId, seedKeyword) {
  const seed = (seedKeyword || project.name || project.domain || '').trim();
  let candidates = [];

  if (dataForSeoService.isConfigured && seed) {
    try {
      const [suggestions, ideas] = await Promise.all([
        retry.withRetry(
          () => dataForSeoService.getKeywordSuggestions(seed, DEFAULT_LOCATION_CODE, DEFAULT_LANGUAGE_CODE, 30),
          { retries: 2, onRetry: (error, attempt) => logger.warn(TAG, `getKeywordSuggestions retry ${attempt + 1}: ${error.message}`) }
        ),
        retry.withRetry(
          () => dataForSeoService.getKeywordIdeas(seed, DEFAULT_LOCATION_CODE, DEFAULT_LANGUAGE_CODE, 30),
          { retries: 2, onRetry: (error, attempt) => logger.warn(TAG, `getKeywordIdeas retry ${attempt + 1}: ${error.message}`) }
        )
      ]);

      const merged = new Map();
      [...(suggestions || []), ...(ideas || [])].forEach((item) => {
        const kw = item.keyword || item.keyword_data?.keyword;
        if (!kw || merged.has(kw.toLowerCase())) return;

        const info = item.keyword_info || item.keyword_data?.keyword_info || {};
        const intentRaw = (info.search_intent_info?.main_intent || 'informational').toLowerCase();

        merged.set(kw.toLowerCase(), {
          keyword: kw,
          searchVolume: info.search_volume || 0,
          cpc: info.cpc || 0,
          competition: info.competition || 0,
          intent: VALID_INTENTS.includes(intentRaw) ? intentRaw : 'unknown',
          keywordDifficulty: 0
        });
      });

      candidates = Array.from(merged.values()).slice(0, MAX_CANDIDATES);

      if (candidates.length > 0) {
        try {
          const difficulties = await retry.withRetry(
            () => dataForSeoService.getKeywordDifficulty(candidates.map((c) => c.keyword)),
            { retries: 1 }
          );
          const difficultyMap = new Map(
            (difficulties || []).map((d) => [(d.keyword || '').toLowerCase(), d.keyword_difficulty || 0])
          );
          candidates = candidates.map((c) => ({
            ...c,
            keywordDifficulty: difficultyMap.get(c.keyword.toLowerCase()) || 0
          }));
        } catch (difficultyError) {
          // Difficulty enrichment is a nice-to-have, not essential — keep
          // the candidates with keywordDifficulty: 0 rather than failing
          // the whole run over a secondary call.
          logger.warn(TAG, `getKeywordDifficulty failed, continuing without it: ${difficultyError.message}`, { projectId: project._id });
        }
      }
    } catch (error) {
      logger.warn(TAG, `DataForSEO keyword research failed for seed "${seed}", falling back to AI seed generation: ${error.message}`, { projectId: project._id });
    }
  }

  if (candidates.length === 0) {
    const seeds = await generateAiKeywordSeeds(project, agencyId, seed);
    candidates = seeds.map((k) => ({
      keyword: k,
      searchVolume: 0,
      cpc: 0,
      competition: 0,
      intent: 'unknown',
      keywordDifficulty: 0
    }));
  }

  return candidates;
}

/**
 * AI fallback for when DataForSEO is unavailable. Deliberately does not
 * fabricate search-volume/difficulty numbers (unlike the existing
 * orchestrator's equivalent fallback) — an AI guess at good keyword terms
 * is not the same as measured search data, and metrics are left at 0/
 * 'unknown' so nothing downstream mistakes them for real numbers.
 */
async function generateAiKeywordSeeds(project, workspaceId, seed) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const prompt = `You are the Keyword Research Agent. Generate 20 realistic, specific SEO keyword targets for "${seed}" — the website ${project.domain} (${project.name}).
${skillsBlock}
${memoryBlock}
Respond ONLY with a JSON array of 20 lowercase keyword strings, nothing else. No commentary, no markdown.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.7,
    maxTokens: 400,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((k) => typeof k === 'string' && k.trim().length > 0).slice(0, 20);
    }
  } catch (error) {
    logger.error(TAG, `Failed to parse AI keyword-seed JSON: ${error.message}`, { projectId: project._id });
  }
  return [];
}

/**
 * Phase 2: the actual agent step. Own prompt; selects and scores the best
 * subset of candidates, with a rationale and theme per keyword. Guards
 * against a hallucinated keyword that wasn't in the candidate list.
 *
 * @param {Object} project
 * @param {Array} candidates - from collectKeywordCandidates
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, selected: Array }>}
 */
async function analyzeAndSuggest(project, candidates, workspaceId) {
  if (candidates.length === 0) {
    return { summary: 'No keyword candidates were available to analyze.', selected: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const targetCount = Math.min(MAX_SUGGESTIONS, candidates.length);

  const prompt = `You are the Keyword Research Agent for ${project.name} (${project.domain}).

Candidate Keywords (metrics of 0/"unknown" mean no measured data was available — treat these conservatively, do not assume they're bad or good):
${JSON.stringify(candidates, null, 2)}
${skillsBlock}
${memoryBlock}

Select the best ${targetCount} keywords from the candidate list above to actively pursue. Do not invent keywords that aren't in the list.

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of the overall opportunity",
  "keywords": [
    { "keyword": "must exactly match one candidate above", "opportunityScore": 0-100, "rationale": "...", "theme": "short grouping label" }
  ]
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.4,
    maxTokens: 1800,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI keyword-selection JSON: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated analysis did not return structured output; manual review recommended.', keywords: [] };
  }

  const candidateMap = new Map(candidates.map((c) => [c.keyword.toLowerCase(), c]));
  const selected = (Array.isArray(parsed.keywords) ? parsed.keywords : [])
    .filter((k) => k.keyword && candidateMap.has(k.keyword.toLowerCase()))
    .slice(0, MAX_SUGGESTIONS)
    .map((k) => {
      const candidate = candidateMap.get(k.keyword.toLowerCase());
      const score = Number(k.opportunityScore);
      return {
        ...candidate,
        keyword: candidate.keyword, // preserve original casing from the candidate, not the AI's echo
        opportunityScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
        rationale: k.rationale || '',
        theme: k.theme || 'general'
      };
    });

  return { summary: parsed.summary || '', selected };
}

/**
 * Full agent run: collect + analyze + persist as 'Suggested' WorkspaceKeyword
 * docs, serialized per-project through Execution Queue. Logs a run-level
 * execution entry (source: 'keywordResearchAgent') alongside aiEngine's own
 * per-AI-call entries.
 *
 * Persists via bulk upsert that only sets `status: 'Suggested'` on INSERT
 * ($setOnInsert) — an existing keyword that a human already Approved (or
 * Rejected) keeps that status even if the agent re-suggests the same term
 * on a later run; only its metrics/rationale refresh.
 *
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @param {Object} [options]
 * @param {string} [options.seedKeyword]
 * @returns {Promise<{ candidateCount: number, suggestedKeywords: Array, summary: string }>}
 */
async function run(projectId, workspaceId, options = {}) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`keyword-research:${projectId}`, async () => {
    const executionId = `keywordResearchAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'keywordResearchAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const candidates = await collectKeywordCandidates(project, agencyId, options.seedKeyword);
      const { summary, selected } = await analyzeAndSuggest(project, candidates, agencyId);

      let suggestedKeywords = [];
      if (selected.length > 0) {
        const bulkOps = selected.map((k) => ({
          updateOne: {
            filter: {
              projectId: project._id,
              keyword: k.keyword,
              locationCode: DEFAULT_LOCATION_CODE,
              languageCode: DEFAULT_LANGUAGE_CODE
            },
            update: {
              $set: {
                agencyId,
                'metrics.searchVolume': k.searchVolume,
                'metrics.cpc': k.cpc,
                'metrics.competition': k.competition,
                'metrics.keywordDifficulty': k.keywordDifficulty,
                'metrics.intent': k.intent,
                source: 'keyword-research-agent',
                'agent.agentKey': AGENT_KEY,
                'agent.opportunityScore': k.opportunityScore,
                'agent.rationale': k.rationale,
                'agent.theme': k.theme
              },
              $setOnInsert: { status: 'Suggested' }
            },
            upsert: true
          }
        }));
        await WorkspaceKeyword.bulkWrite(bulkOps);

        suggestedKeywords = await WorkspaceKeyword.find({
          projectId: project._id,
          keyword: { $in: selected.map((k) => k.keyword) },
          locationCode: DEFAULT_LOCATION_CODE,
          languageCode: DEFAULT_LANGUAGE_CODE
        }).lean();
      }

      logger.logExecution({
        executionId, source: 'keywordResearchAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { candidateCount: candidates.length, suggestedCount: suggestedKeywords.length }
      });

      return { candidateCount: candidates.length, suggestedKeywords, summary };
    } catch (error) {
      logger.logExecution({
        executionId, source: 'keywordResearchAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * Human Approval Gate — approve path. Only 'Suggested' keywords for this
 * project can move to 'Approved'; already-Approved/Rejected keywords in the
 * same request are silently left alone by the query filter, not errored on,
 * since a bulk approval request may legitimately include a mixed batch.
 *
 * @param {string} projectId
 * @param {string[]} keywordIds
 * @param {string} userId
 */
async function approveKeywords(projectId, keywordIds, userId) {
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw new Error('At least one keywordId is required');
  }

  const result = await WorkspaceKeyword.updateMany(
    { _id: { $in: keywordIds }, projectId, status: 'Suggested' },
    { $set: { status: 'Approved', approvedBy: userId, approvedAt: new Date(), rejectionReason: null } }
  );

  auditLogService.record({
    targetType: 'Keyword', targetId: projectId, projectId,
    action: 'keywords_approved', fromValue: 'Suggested', toValue: `${result.modifiedCount} approved`, userId
  });

  return result;
}

/**
 * Human Approval Gate — reject path. Rejected keywords stay in the
 * collection (not deleted) so recordExcludedThemesIfRepeated can detect a
 * theme being rejected across multiple runs and stop re-suggesting it.
 */
async function rejectKeywords(projectId, keywordIds, userId, reason) {
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw new Error('At least one keywordId is required');
  }

  const result = await WorkspaceKeyword.updateMany(
    { _id: { $in: keywordIds }, projectId, status: 'Suggested' },
    { $set: { status: 'Rejected', rejectionReason: reason || null } }
  );

  auditLogService.record({
    targetType: 'Keyword', targetId: projectId, projectId,
    action: 'keywords_rejected', fromValue: 'Suggested', toValue: `${result.modifiedCount} rejected`, userId
  });

  await recordExcludedThemesIfRepeated(projectId, keywordIds, userId);

  return result;
}

/**
 * Shared Memory write-side: if a rejected keyword's theme has now been
 * rejected 2+ times total for this project, record it as an
 * excluded_keyword_theme so future runs' recall() steers away from it.
 * Best-effort — a memory-write failure must never break rejection.
 */
async function recordExcludedThemesIfRepeated(projectId, keywordIds, userId) {
  try {
    const rejected = await WorkspaceKeyword.find({ _id: { $in: keywordIds }, projectId }).lean();
    const themes = [...new Set(rejected.map((k) => k.agent?.theme).filter(Boolean))];
    if (themes.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const theme of themes.slice(0, 3)) {
      const priorRejectionCount = await WorkspaceKeyword.countDocuments({
        projectId, 'agent.theme': theme, status: 'Rejected'
      });

      if (priorRejectionCount >= 2) {
        await sharedMemory.remember({
          agencyId,
          projectId,
          title: `Excluded keyword theme: ${theme}`,
          description: `Keywords themed "${theme}" have been rejected ${priorRejectionCount} times for this project.`,
          content: `Avoid suggesting further keywords in the "${theme}" theme unless explicitly requested.`,
          type: 'excluded_keyword_theme'
        });
      }
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-theme memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * Own execution history, read-side. Same shape as seoAuditorAgent's
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'keywordResearchAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectKeywordCandidates,
  analyzeAndSuggest,
  approveKeywords,
  rejectKeywords,
  getExecutionHistory
};
