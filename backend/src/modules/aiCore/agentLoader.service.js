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
  },
  'competitor-agent': {
    key: 'competitor-agent',
    displayName: 'Competitor Agent',
    skills: ['competitor-threat-assessment', 'competitive-gap-analysis'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'technical-seo-agent': {
    key: 'technical-seo-agent',
    displayName: 'Technical SEO Agent',
    skills: ['technical-infrastructure-audit', 'audit-severity-prioritization'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'content-agent': {
    key: 'content-agent',
    displayName: 'Content Agent',
    skills: ['content-brief-generation', 'topic-clustering'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'schema-agent': {
    key: 'schema-agent',
    displayName: 'Schema Agent',
    skills: ['schema-markup-generation', 'schema-validation'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'internal-linking-agent': {
    key: 'internal-linking-agent',
    displayName: 'Internal Linking Agent',
    skills: ['internal-linking-strategy', 'orphan-page-detection'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'image-seo-agent': {
    key: 'image-seo-agent',
    displayName: 'Image SEO Agent',
    skills: ['image-alt-text-optimization', 'image-file-seo'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'website-builder-seo-agent': {
    key: 'website-builder-seo-agent',
    displayName: 'Website Builder SEO Agent',
    skills: ['builder-onpage-metadata-optimization', 'builder-heading-structure-audit'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'blog-seo-agent': {
    key: 'blog-seo-agent',
    displayName: 'Blog SEO Agent',
    skills: ['builder-onpage-metadata-optimization', 'builder-heading-structure-audit'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'store-seo-agent': {
    key: 'store-seo-agent',
    displayName: 'Store SEO Agent',
    skills: ['builder-onpage-metadata-optimization', 'technical-infrastructure-audit'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'automation-agent': {
    key: 'automation-agent',
    displayName: 'Automation Agent',
    skills: ['alert-configuration', 'executive-summary'],
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isSystemDefault: true
  },
  'aeo-agent': {
    key: 'aeo-agent',
    displayName: 'AEO Agent',
    skills: ['answer-extractability-optimization', 'ai-citation-readiness'],
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