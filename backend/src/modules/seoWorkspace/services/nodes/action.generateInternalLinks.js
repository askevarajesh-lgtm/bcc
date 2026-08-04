const internalLinkingAgent = require('../internalLinkingAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceInternalLink = require('../../models/workspaceInternalLink.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionGenerateInternalLinks';

module.exports = {
  id: 'generate_internal_links',
  name: 'Generate Internal Linking Graph',
  category: 'Internal Linking',
  icon: 'GitBranch',
  description: 'Constructs project link graph, detects orphan pages, and generates contextual anchor-text links between related articles.',

  documentation: {
    overview: 'Analyzes site crawl links, finds pages with zero or low inbound links (orphan pages), and recommends semantically relevant internal links.',
    inputsDoc: [
      { name: 'maxSuggestions', desc: 'Maximum number of link suggestions to generate', type: 'number', default: 10 },
      { name: 'fixOrphanPages', desc: 'Prioritize linking to orphan pages', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'orphanPagesFound', desc: 'Number of detected orphan pages', type: 'number' },
      { name: 'suggestionsCount', desc: 'Total proposed internal links', type: 'number' },
      { name: 'linkGraphDensity', desc: 'Calculated link graph density index (0-100)', type: 'number' },
      { name: 'suggestions', desc: 'Full list of suggestions containing sourceUrl, targetUrl, anchorText, reason', type: 'array' },
      { name: 'orphanPages', desc: 'Array of detected orphan page URLs', type: 'array' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 25000,
  estimatedCost: { apiCalls: 1, aiTokens: 250, thirdPartyCalls: 0 },
  dependencies: [],
  permissions: ['seo:links:generate'],

  getInputSchema() {
    return [
      { name: 'maxSuggestions', label: 'Max Link Suggestions', type: 'number', defaultValue: 10, min: 1, max: 50 },
      { name: 'fixOrphanPages', label: 'Prioritize Orphan Pages', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      orphanPagesFound: { type: 'number', description: 'Orphan pages detected' },
      suggestionsCount: { type: 'number', description: 'Link suggestions count' },
      linkGraphDensity: { type: 'number', description: 'Link graph density score' },
      suggestions: { type: 'array', description: 'List of internal link suggestions' },
      orphanPages: { type: 'array', description: 'List of orphan page URLs' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Internal Linking Agent for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        orphanPagesFound: 1,
        suggestionsCount: Number(config.maxSuggestions) || 8,
        linkGraphDensity: 84,
        suggestions: [],
        orphanPages: []
      };
    }

    try {
      if (project) {
        await internalLinkingAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Internal linking agent execution error: ${err.message}`);
    }

    const linkDoc = await WorkspaceInternalLink.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!linkDoc) {
      return {
        success: false,
        error: 'Internal linking analysis failed or no linking document found.',
        orphanPagesFound: 0,
        suggestionsCount: 0
      };
    }

    const pages = linkDoc.inputs?.pages || [];
    const orphanPages = pages.filter(p => p.isOrphan).map(p => p.url);
    const suggestions = (linkDoc.agent?.suggestions || []).map(s => ({
      sourceUrl: s.sourceUrl,
      targetUrl: s.targetUrl,
      anchorText: s.anchorText,
      reasonCategory: s.reasonCategory || 'topical_relevance',
      rationale: s.rationale || ''
    }));

    // Calculate dynamic graph density index
    // density = (actual links / potential links) * 100
    const totalPages = pages.length;
    const potentialLinks = totalPages * (totalPages - 1);
    const actualLinksCount = pages.reduce((sum, p) => sum + (p.outboundInternalLinks?.length || 0), 0);
    const linkGraphDensity = potentialLinks > 0 ? Math.min(100, Math.round((actualLinksCount / potentialLinks) * 100)) : 84;

    return {
      success: true,
      linkDocId: linkDoc._id.toString(),
      orphanPagesFound: orphanPages.length,
      suggestionsCount: suggestions.length,
      linkGraphDensity,
      suggestions: suggestions.slice(0, Number(config.maxSuggestions) || 50),
      orphanPages,
      approvalStatus: linkDoc.agent?.approvalStatus || '',
      completedAt: linkDoc.completedAt ? new Date(linkDoc.completedAt).toISOString() : null
    };
  }
};
