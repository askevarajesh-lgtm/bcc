const aeoAgent = require('../aeoAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const {
  WorkspaceAeoAudit,
  WorkspaceAeoAuditPage,
  WorkspaceAeoAuditRecommendation
} = require('../../models/workspaceAeoAuditAsset.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunAeoAudit';

module.exports = {
  id: 'run_aeo_audit',
  name: 'Run Answer Engine Optimization (AEO) Audit',
  category: 'AEO / LLM Citations',
  icon: 'Bot',
  description: 'Audits visibility and citation frequency across ChatGPT, Perplexity, Claude, Google SGE, and Gemini answer engines.',

  documentation: {
    overview: 'Runs an AEO diagnostic to evaluate brand citation rate, conversational query answerability, and entity authority across generative AI models.',
    inputsDoc: [
      { name: 'targetQueries', desc: 'Comma-separated prompt queries to test in AI engines', type: 'string', required: false },
      { name: 'engines', desc: 'AI answer engines to test (ChatGPT, Perplexity, Gemini, Claude)', type: 'array', default: ['ChatGPT', 'Perplexity', 'Gemini'] }
    ],
    outputsDoc: [
      { name: 'aeoAuditId', desc: 'WorkspaceAeoAudit document ID', type: 'string' },
      { name: 'overallAeoScore', desc: 'Overall AEO visibility score (0-100)', type: 'number' },
      { name: 'citationScore', desc: 'Citation score across engines', type: 'number' },
      { name: 'eeatScore', desc: 'E-E-A-T signals score', type: 'number' },
      { name: 'platformScores', desc: 'Per-engine scores (ChatGPT, Gemini, Perplexity, etc)', type: 'object' },
      { name: 'pagesAnalyzedCount', desc: 'Number of pages analyzed for AEO readiness', type: 'number' },
      { name: 'recommendationsCount', desc: 'Actionable recommendations generated', type: 'number' },
      { name: 'pages', desc: 'Per-page AEO readiness analysis with FAQ suggestions', type: 'array' },
      { name: 'recommendations', desc: 'Top AEO recommendations with priority and type', type: 'array' },
      { name: 'summary', desc: 'AI-generated AEO summary', type: 'string' },
      { name: 'approvalStatus', desc: 'Agent approval status', type: 'string' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 600, thirdPartyCalls: 2 },
  dependencies: [],
  permissions: ['seo:aeo:audit'],

  getInputSchema() {
    return [
      { name: 'targetQueries', label: 'Target Conversational Queries', type: 'textarea', placeholder: 'What are the best SEO automation platforms? How does AskEva compare?' },
      { name: 'engines', label: 'Engines to Benchmark', type: 'select', defaultValue: 'all', options: [
        { label: 'All Engines (ChatGPT, Perplexity, Gemini, Claude)', value: 'all' },
        { label: 'ChatGPT & Perplexity Only', value: 'top_two' },
        { label: 'Google Gemini & SGE Only', value: 'google_only' }
      ]}
    ];
  },

  getOutputSchema() {
    return {
      aeoAuditId: { type: 'string', description: 'AEO audit ID' },
      overallAeoScore: { type: 'number', description: 'AEO score (0-100)' },
      citationScore: { type: 'number', description: 'Citation score' },
      eeatScore: { type: 'number', description: 'E-E-A-T score' },
      platformScores: { type: 'object', description: 'Per-engine scores' },
      pagesAnalyzedCount: { type: 'number', description: 'Pages analyzed' },
      recommendationsCount: { type: 'number', description: 'Recommendations count' },
      pages: { type: 'array', description: 'Per-page AEO analysis' },
      recommendations: { type: 'array', description: 'AEO recommendations' },
      summary: { type: 'string', description: 'AEO summary' },
      approvalStatus: { type: 'string', description: 'Agent approval status' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing AEO Audit for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        aeoAuditId: `sim_aeo_${Date.now()}`,
        overallAeoScore: 0,
        citationScore: 0,
        eeatScore: 0,
        platformScores: {},
        pagesAnalyzedCount: 0,
        recommendationsCount: 0,
        pages: [],
        recommendations: [],
        summary: 'Simulation: AEO audit completed.',
        approvalStatus: 'Pending Approval'
      };
    }

    try {
      if (project) {
        await aeoAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `AEO agent execution error: ${err.message}`);
    }

    const aeoDoc = await WorkspaceAeoAudit.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!aeoDoc) {
      return {
        success: false,
        error: 'AEO audit failed or no completed audit found.',
        aeoAuditId: null
      };
    }

    // Fetch associated page analyses and recommendations from separate collections
    let aeoPages = [];
    let aeoRecommendations = [];

    try {
      aeoPages = await WorkspaceAeoAuditPage.find({ auditId: aeoDoc._id }).lean();
    } catch (e) {
      // Fallback to inline pages if separate model doesn't exist
      aeoPages = aeoDoc.agent?.pages || [];
    }

    try {
      aeoRecommendations = await WorkspaceAeoAuditRecommendation.find({ auditId: aeoDoc._id }).lean();
    } catch (e) {
      aeoRecommendations = [];
    }

    const overallScores = aeoDoc.overallScores || {};

    return {
      success: true,
      aeoAuditId: aeoDoc._id.toString(),
      status: aeoDoc.status,
      overallAeoScore: overallScores.aeo ?? 0,
      citationScore: overallScores.citation ?? 0,
      eeatScore: overallScores.eeat ?? 0,
      platformScores: overallScores.platforms || {},
      summary: aeoDoc.agent?.summary || aeoDoc.summary || '',
      approvalStatus: aeoDoc.agent?.approvalStatus || '',
      pagesAnalyzedCount: aeoPages.length,
      recommendationsCount: aeoRecommendations.length,
      pages: aeoPages.map(p => ({
        pageUrl: p.pageUrl || p.url || '',
        aeoReadinessScore: p.aeoReadinessScore ?? null,
        directAnswerSuggestion: p.directAnswerSuggestion || '',
        suggestedFaqBlock: p.suggestedFaqBlock || [],
        missingElements: p.missingElements || [],
        rationale: p.rationale || ''
      })),
      recommendations: aeoRecommendations.map(r => ({
        recommendationId: r._id?.toString(),
        type: r.type || '',
        priority: r.priority || 'medium',
        title: r.title || r.recommendation || '',
        description: r.description || '',
        pageUrl: r.pageUrl || null
      })),
      completedAt: aeoDoc.completedAt ? new Date(aeoDoc.completedAt).toISOString() : null,
      executionTime: aeoDoc.executionTime || 0
    };
  }
};
