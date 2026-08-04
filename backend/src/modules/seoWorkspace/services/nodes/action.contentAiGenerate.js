const contentAgent = require('../contentAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceContentBrief = require('../../models/workspaceContentBrief.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionContentAiGenerate';

module.exports = {
  id: 'content_ai_generate',
  name: 'Generate Content AI Brief',
  category: 'Content AI',
  icon: 'FileText',
  description: 'Uses generative AI to construct high-ranking SEO content briefs, meta tags, heading outlines, semantic keywords, and FAQ sections.',

  documentation: {
    overview: 'Generates SEO-optimized content briefs and outlines tailored to target keyword intent, search volume, and competitor weaknesses.',
    inputsDoc: [
      { name: 'targetKeyword', desc: 'Primary keyword for the content brief', type: 'string', required: false },
      { name: 'contentType', desc: 'Type of content (Article, Pillar Page, Product Guide, Landing Page)', type: 'string', default: 'Article' },
      { name: 'targetWordCount', desc: 'Target word count for draft generation', type: 'number', default: 1500 },
      { name: 'includeFaqSchema', desc: 'Include structured FAQ questions & answers in output', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'briefId', desc: 'MongoDB ID of the created WorkspaceContentBrief', type: 'string' },
      { name: 'briefsCount', desc: 'Number of content briefs generated', type: 'number' },
      { name: 'briefs', desc: 'Full array of content briefs with title, outline, keywords, meta tags, FAQ', type: 'array' },
      { name: 'summary', desc: 'AI-generated content strategy summary', type: 'string' },
      { name: 'approvalStatus', desc: 'Approval status of the generated briefs', type: 'string' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 800, thirdPartyCalls: 1 },
  dependencies: [],
  permissions: ['seo:content:generate'],

  getInputSchema() {
    return [
      { name: 'targetKeyword', label: 'Target Keyword', type: 'text', placeholder: 'e.g. enterprise seo automation' },
      { name: 'contentType', label: 'Content Type', type: 'select', defaultValue: 'Article', options: [
        { label: 'Long-Form Article / Blog Post', value: 'Article' },
        { label: 'Comprehensive Pillar Page', value: 'Pillar Page' },
        { label: 'Product Comparison Guide', value: 'Product Guide' },
        { label: 'High-Converting Landing Page', value: 'Landing Page' }
      ]},
      { name: 'targetWordCount', label: 'Target Word Count', type: 'number', defaultValue: 1500, min: 300, max: 8000 },
      { name: 'includeFaqSchema', label: 'Generate FAQ Q&A Schema Section', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      briefId: { type: 'string', description: 'WorkspaceContentBrief document ID' },
      briefsCount: { type: 'number', description: 'Number of briefs generated' },
      briefs: { type: 'array', description: 'Full content brief objects with title, outline, keywords, meta, FAQs' },
      summary: { type: 'string', description: 'AI strategy summary' },
      approvalStatus: { type: 'string', description: 'Agent approval status' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Content AI generation for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        briefId: `sim_brief_${Date.now()}`,
        briefsCount: 1,
        briefs: [],
        summary: 'Simulation: Content brief generation completed.',
        approvalStatus: 'Pending Approval'
      };
    }

    try {
      if (project) {
        await contentAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Content agent execution error: ${err.message}`);
    }

    // Read the most recently created brief document
    const briefDoc = await WorkspaceContentBrief.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!briefDoc) {
      return {
        success: false,
        error: 'Content brief generation failed or no brief found for this project.',
        briefId: null
      };
    }

    // Map the full briefs array from the DB record
    const briefs = (briefDoc.agent?.briefs || []).map(b => ({
      targetKeyword: b.targetKeyword,
      title: b.title,
      contentType: b.contentType,
      recommendedAction: b.recommendedAction,
      targetUrl: b.targetUrl || null,
      metaTitle: b.metaTitle || '',
      metaDescription: b.metaDescription || '',
      wordCountTarget: b.wordCountTarget || null,
      outline: b.outline || [],
      headingsCount: (b.outline || []).length,
      secondaryKeywords: b.secondaryKeywords || [],
      theme: b.theme || '',
      rationale: b.rationale || ''
    }));

    // The first brief's data is surfaced at the top level for easy variable access
    const primaryBrief = briefs[0] || {};

    return {
      success: true,
      briefId: briefDoc._id.toString(),
      briefsCount: briefs.length,
      summary: briefDoc.agent?.summary || '',
      approvalStatus: briefDoc.agent?.approvalStatus || '',
      completedAt: briefDoc.completedAt ? new Date(briefDoc.completedAt).toISOString() : null,
      // Top-level convenience fields (first brief)
      title: primaryBrief.title || '',
      metaDescription: primaryBrief.metaDescription || '',
      targetKeyword: primaryBrief.targetKeyword || '',
      outline: primaryBrief.outline || [],
      headingsCount: primaryBrief.headingsCount || 0,
      suggestedKeywords: primaryBrief.secondaryKeywords || [],
      contentType: primaryBrief.contentType || '',
      wordCountTarget: primaryBrief.wordCountTarget || null,
      // Full structured output
      briefs
    };
  }
};
