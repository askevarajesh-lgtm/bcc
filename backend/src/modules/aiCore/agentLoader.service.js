/**
 * AI Core — Agent Loader
 *
 * IMPORTANT: this does not define, implement, or run any agent. It only
 * resolves *configuration* (which skills to inject, which model/provider to
 * use) for an agent key that already exists in
 * `workspaceAgentOrchestrator.service.js`. No new agent logic is added here.
 *
 * `DEFAULT_AGENTS` below is a data-only mirror of the four agent methods that
 * already run today (seoStrategistAgent, seoTechImplementerAgent,
 * seoReporterAgent, seoMonitorAgent), copied 1:1 from their current
 * hardcoded skill lists and model name so behavior is identical to what's
 * already deployed — this only makes it *inspectable/overridable* data
 * instead of literals buried in the orchestrator.
 *
 * This mirrors the `seo_agents` collection proposed in
 * `seo-mongodb-schema-plan.md` §2.1, but deliberately does NOT create that
 * collection/model here — introducing a new persisted "agents" concept is a
 * separate decision the schema doc explicitly flagged as needing
 * confirmation (§ "Open items"), and the instruction for this pass is
 * explicit: do not create agents. `resolve()` takes an optional
 * `overrideLookupFn` so that collection can be wired in later, in a
 * subsequent phase, without changing this file's shape.
 */
const skillLoader = require('../../seoWorkspace/services/skillLoader.service');

const DEFAULT_AGENTS = {
  'seo-strategist': {
    key: 'seo-strategist',
    displayName: 'SEO Strategist',
    skills: ['keyword-research', 'content-gap-analysis', 'serp-intent-mapping', 'roadmap-roi-planning'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'seo-tech-implementer': {
    key: 'seo-tech-implementer',
    displayName: 'SEO Tech Implementer',
    skills: ['content-brief-generation', 'topic-clustering'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'seo-reporter': {
    key: 'seo-reporter',
    displayName: 'SEO Reporter',
    skills: ['seo-report-writing', 'executive-summary'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'seo-monitor': {
    key: 'seo-monitor',
    displayName: 'SEO Monitor',
    skills: ['rank-tracking', 'alert-configuration'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  }
};

/**
 * @param {string} agentKey
 * @param {Function} [overrideLookupFn] - optional async (agentKey) => partialConfig,
 *   for a future per-agency override source. Not called unless supplied.
 */
async function resolve(agentKey, overrideLookupFn = null) {
  const base = DEFAULT_AGENTS[agentKey];
  if (!base) {
    throw new Error(`AgentLoader: unknown agentKey "${agentKey}". Known keys: ${Object.keys(DEFAULT_AGENTS).join(', ')}`);
  }

  let config = { ...base };
  if (typeof overrideLookupFn === 'function') {
    const override = await overrideLookupFn(agentKey);
    if (override) config = { ...config, ...override };
  }

  return config;
}

/**
 * Loads the concatenated skill markdown for an agent's configured skill list.
 * Pure delegation to the existing skillLoader.service.js — no new loading
 * mechanism, no new skill content.
 */
function loadSkillsForAgent(agentConfig) {
  return skillLoader.loadSkillsForAgent(agentConfig.skills || []);
}

function listKnownAgentKeys() {
  return Object.keys(DEFAULT_AGENTS);
}

module.exports = { resolve, loadSkillsForAgent, listKnownAgentKeys, DEFAULT_AGENTS };
