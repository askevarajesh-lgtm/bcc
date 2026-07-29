/**
 * AI Recommendation Layer — AI SEO Platform v2 §2.
 *
 * Takes a `ComparisonResult` (from `comparisonEngine.service.js`) and
 * produces `Recommendation` docs. Reuses, unchanged:
 *   - `aiCore/aiEngine.service.js` for the AI call (same per-tenant
 *     AiSettings/crypto key resolution `competitorAgent.service.js` uses —
 *     no new key-management code).
 *   - `aiCore/agentLoader.service.js` + `skillLoader.service.js` (via
 *     `agentLoader.loadSkillsForAgent`) to inject SEO methodology.
 *   - `aiCore/sharedMemory.service.js` for cross-cutting human-authored notes.
 *   - `aiCore/executionQueue.service.js` to serialize runs per project, same
 *     as every other agent in this module.
 *
 * Priority isn't solely an LLM guess: a deterministic pre-score (search
 * volume × gap-type weight, since keyword difficulty isn't reliably
 * available across both providers) is computed in code first, then the AI
 * call reorders/annotates with rationale — reproducible without a model
 * call if the AI step fails.
 */
const WorkspaceProject = require('../../seoWorkspace/models/workspaceProject.model');
const Recommendation = require('../models/recommendation.model');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const agentLoader = require('../../aiCore/agentLoader.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const logger = require('../../aiCore/logger.service');

const AGENT_KEY = 'competitor-intelligence-agent';
const TAG = 'CompetitorRecommendation';

// Deterministic weight per gap type — a keyword_gap opportunity is worth
// more than a page_gap of otherwise-equal search volume, since it converts
// to organic traffic more directly. Tunable, not a magic AI guess.
const TYPE_WEIGHT = {
  keyword_gap: 1.0,
  content_gap: 0.8,
  page_gap: 0.6,
  backlink_gap: 0.4
};

// Simple CTR-by-rank curve, matching the shape already implicit in this
// codebase's rank-tracking code paths (roughly: #1 gets a large share of
// clicks, falling off fast) — not a newly invented formula.
const CTR_BY_RANK = [0, 0.28, 0.15, 0.10, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015];

function ctrForRank(rank) {
  if (!rank || rank < 1) return 0.01; // unranked/unknown competitor rank — conservative floor, never 0-with-confidence
  if (rank <= 10) return CTR_BY_RANK[rank];
  return 0.01;
}

/** @returns {number} deterministic pre-score, higher = more valuable to act on first */
function preScore(row, type) {
  const weight = TYPE_WEIGHT[type] || 0.5;
  const volume = row.searchVolume || 0;
  return Math.round(volume * weight * 100) / 100;
}

/** @returns {number} estimatedTraffic ≈ searchVolume × CTR(competitorRank) — 0 when volume is unknown, never fabricated */
function estimateTrafficImpact(row) {
  if (!row.searchVolume) return 0;
  return Math.round(row.searchVolume * ctrForRank(row.competitorRank));
}

function deterministicRationale(row, type) {
  const labels = {
    keyword_gap: `${row.competitorDomain} ranks #${row.competitorRank ?? '?'} for this keyword with no equivalent ranking on your site`,
    content_gap: `${row.competitorDomain} has a ranking page for this term with no equivalent page found on your site`,
    page_gap: `${row.competitorDomain} has a ranking page (${row.pageUrl || 'url unknown'}) your site has no counterpart for`,
    backlink_gap: row.referringDomain
      ? `${row.competitorDomain} has a referring domain (${row.referringDomain}) not found linking to your site`
      : `${row.competitorDomain} has more referring domains than your site (aggregate gap; provider did not return a per-domain list)`
  };
  return labels[type] || 'Competitive gap identified.';
}

/**
 * @param {Object} comparisonResult - from comparisonEngine.compare()
 * @param {string} projectId
 * @param {string} workspaceId - agencyId, used for AI credential/memory scoping
 * @returns {Promise<Recommendation[]>}
 */
async function generateRecommendations(comparisonResult, projectId, workspaceId) {
  return executionQueue.run(`competitor-intelligence-agent:${projectId}`, async () => {
    const { comparisonId, type, rows } = comparisonResult;
    if (!rows || rows.length === 0) return [];

    const project = await WorkspaceProject.findById(projectId);
    if (!project) throw new Error('CompetitorRecommendation: project not found');

    // Deterministic pre-score first, always available even if the AI step fails.
    const scored = rows.map((row) => ({
      row,
      priorityScore: preScore(row, type),
      estimatedTrafficImpact: estimateTrafficImpact(row),
      rationale: deterministicRationale(row, type),
      rationaleSource: 'deterministic-fallback'
    }));

    let aiAnnotations = null;
    try {
      aiAnnotations = await annotateWithAi(scored, project, workspaceId, type);
    } catch (error) {
      logger.warn(TAG, `AI annotation failed, using deterministic rationale only: ${error.message}`, { projectId });
    }

    const docs = scored.map((entry, idx) => {
      const ai = aiAnnotations?.[idx];
      return {
        comparisonId,
        projectId,
        agencyId: workspaceId,
        type,
        item: entry.row,
        rationale: ai?.rationale || entry.rationale,
        priorityScore: entry.priorityScore, // never overridden by the AI step — stays reproducible
        estimatedTrafficImpact: entry.estimatedTrafficImpact,
        effortHint: ai?.effortHint || 'medium',
        status: 'proposed',
        agent: { agentKey: AGENT_KEY, rationaleSource: ai ? 'ai' : 'deterministic-fallback' }
      };
    });

    return Recommendation.insertMany(docs);
  });
}

/** Best-effort AI rationale/effort-hint annotation, in the same row order as `scored`. Never throws past the caller's try/catch. */
async function annotateWithAi(scored, project, workspaceId, type) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  const prompt = `You are the Competitor Intelligence Agent for ${project.name} (${project.domain}).

Gap type: ${type}. Below are ${scored.length} competitive gaps already pre-scored deterministically — do not re-score them, only add a short rationale and an effort estimate:
${JSON.stringify(scored.map((s) => s.row), null, 2)}
${skillsBlock}
${memoryBlock}

Respond ONLY with a JSON array, same length and order as the input, of:
{ "rationale": "1-2 sentence explanation grounded in the row's own fields, no invented numbers", "effortHint": "low | medium | high" }
No markdown formatting or commentary.`;

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

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length !== scored.length) {
    throw new Error('AI annotation response shape did not match input length');
  }
  return parsed.map((p) => ({
    rationale: typeof p.rationale === 'string' ? p.rationale : null,
    effortHint: ['low', 'medium', 'high'].includes(p.effortHint) ? p.effortHint : 'medium'
  }));
}

module.exports = { generateRecommendations };
