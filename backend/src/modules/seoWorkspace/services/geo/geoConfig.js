/**
 * Central configuration for the Enterprise GEO Engine.
 * Modifying this file alters how analyzers evaluate scores, prioritize rules, and interact with AI.
 */

const geoConfig = {
  // Enabled analyzers and their DAG execution order (dependencies resolve left-to-right implicitly in registry)
  enabledAnalyzers: [
    'technicalAnalyzer',
    'contentAnalyzer',
    'schemaAnalyzer',
    'authorityAnalyzer',
    'entityAnalyzer',
    'knowledgeGraphAnalyzer',
    'citationAnalyzer',
    'hallucinationAnalyzer',
    'eeatAnalyzer'
  ],

  // Weighted distribution of each analyzer category towards the Overall GEO Score
  weights: {
    technical: 10,
    content: 15,
    schema: 15,
    authority: 10,
    entity: 15,
    knowledgeGraph: 10,
    citation: 10,
    hallucination: 5,
    eeat: 10
  },

  // Scoring thresholds for health categorization
  scoreRanges: {
    excellent: { min: 90, max: 100 },
    good: { min: 70, max: 89 },
    fair: { min: 50, max: 69 },
    poor: { min: 0, max: 49 }
  },

  // Deterministic priority rules for Recommendation Engine deduplication/assignment
  priorityRules: {
    critical: [
      'missing_robots_txt',
      'missing_sitemap_xml',
      'broken_canonical',
      'missing_organization_schema',
      'no_indexable_pages'
    ],
    high: [
      'missing_h1',
      'duplicate_title_tags',
      'missing_local_business_schema',
      'high_hallucination_risk',
      'missing_sameas_links'
    ],
    medium: [
      'weak_heading_hierarchy',
      'missing_faq_schema',
      'low_entity_consistency',
      'missing_author_bios'
    ],
    low: [
      'short_content_chunks',
      'missing_open_graph_tags',
      'low_citation_readiness'
    ]
  },

  // Supported schema types for validation
  supportedSchemaTypes: [
    'Organization', 'WebSite', 'WebPage', 'Article', 'BlogPosting',
    'FAQPage', 'HowTo', 'Person', 'Product', 'Service', 'Review',
    'AggregateRating', 'BreadcrumbList', 'LocalBusiness', 'ContactPage',
    'AboutPage', 'SearchAction', 'SpeakableSpecification', 'Dataset'
  ],

  // Supported AI Providers for Citation Readiness and Explanation
  supportedAIEngines: [
    'ChatGPT',
    'Gemini',
    'Claude',
    'Perplexity',
    'Copilot',
    'Google AI Overviews'
  ]
};

module.exports = geoConfig;
