
const skillLoader = require('../seoWorkspace/services/skillLoader.service');

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
  },
  'seo-auditor': {
    key: 'seo-auditor',
    displayName: 'SEO Auditor',
    skills: ['technical-seo-audit-analysis', 'audit-severity-prioritization'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'keyword-research': {
    key: 'keyword-research',
    displayName: 'Keyword Research',
    skills: ['keyword-opportunity-scoring', 'keyword-intent-classification'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  }
};

/**
 * @param {string} agentKey
 * @param {Function} [overrideLookupFn] 
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

function loadSkillsForAgent(agentConfig) {
  return skillLoader.loadSkillsForAgent(agentConfig.skills || []);
}

function listKnownAgentKeys() {
  return Object.keys(DEFAULT_AGENTS);
}

module.exports = { resolve, loadSkillsForAgent, listKnownAgentKeys, DEFAULT_AGENTS };