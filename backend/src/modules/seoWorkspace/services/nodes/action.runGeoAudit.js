const geoAgent = require('../geoAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const { 
  WorkspaceGeoAudit,
  WorkspaceGeoTechnicalAnalysis,
  WorkspaceGeoEntityAnalysis,
  WorkspaceGeoPageAnalysis
} = require('../../models/workspaceGeoAuditAsset.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunGeoAudit';

module.exports = {
  id: 'run_geo_audit',
  name: 'Run Generative Engine Optimization (GEO) Audit',
  category: 'GEO / Knowledge Graph',
  icon: 'Globe',
  description: 'Audits generative search knowledge presence, entity consistency, brand sentiment, and LLM training data representation.',

  documentation: {
    overview: 'Analyzes entity signals across Wikidata, Google Knowledge Graph, Wikipedia, and AI training corpora to maximize brand presence in generative summaries.',
    inputsDoc: [
      { name: 'brandName', desc: 'Brand or organization entity name', type: 'string', required: false },
      { name: 'entityType', desc: 'Schema / entity type (Organization, SoftwareApplication, LocalBusiness)', type: 'string', default: 'Organization' }
    ],
    outputsDoc: [
      { name: 'geoAuditId', desc: 'WorkspaceGeoAudit record ID', type: 'string' },
      { name: 'geoScore', desc: 'Overall GEO score out of 100', type: 'number' },
      { name: 'healthLevel', desc: 'GEO health level (excellent, good, fair, poor)', type: 'string' },
      { name: 'entityConsistencyScore', desc: 'Entity alignment across knowledge bases (0-100)', type: 'number' },
      { name: 'brandSentimentScore', desc: 'Sentiment rating in generative citations (0-100)', type: 'number' },
      { name: 'pagesProcessed', desc: 'Total pages evaluated', type: 'number' },
      { name: 'technicalIssuesCount', desc: 'Count of technical issues flagged', type: 'number' },
      { name: 'entityIssuesCount', desc: 'Count of entity conflicts found', type: 'number' },
      { name: 'recommendationsCount', desc: 'Actionable recommendations generated', type: 'number' },
      { name: 'recommendations', desc: 'Full array of brand presence optimization recommendations', type: 'array' },
      { name: 'entityAnalysis', desc: 'Detailed knowledge graph and Wikidata verification status object', type: 'object' },
      { name: 'technicalAnalysis', desc: 'Schema presence and markup consistency indicators object', type: 'object' },
      { name: 'summary', desc: 'AI-generated GEO summary commentary', type: 'string' },
      { name: 'approvalStatus', desc: 'Agent approval status', type: 'string' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 400, thirdPartyCalls: 1 },
  dependencies: [],
  permissions: ['seo:geo:audit'],

  getInputSchema() {
    return [
      { name: 'brandName', label: 'Brand / Entity Name', type: 'text', placeholder: 'e.g. AskEva' },
      { name: 'entityType', label: 'Entity Type', type: 'select', defaultValue: 'Organization', options: [
        { label: 'Organization / Company', value: 'Organization' },
        { label: 'Software Application / SaaS', value: 'SoftwareApplication' },
        { label: 'Local Business / Franchise', value: 'LocalBusiness' }
      ]}
    ];
  },

  getOutputSchema() {
    return {
      geoAuditId: { type: 'string', description: 'GEO audit ID' },
      geoScore: { type: 'number', description: 'Overall GEO score' },
      healthLevel: { type: 'string', description: 'GEO health classification' },
      entityConsistencyScore: { type: 'number', description: 'Consistency score' },
      brandSentimentScore: { type: 'number', description: 'Brand sentiment score' },
      pagesProcessed: { type: 'number', description: 'Pages analyzed' },
      technicalIssuesCount: { type: 'number', description: 'Technical issues count' },
      entityIssuesCount: { type: 'number', description: 'Entity issues count' },
      recommendationsCount: { type: 'number', description: 'Recommendations count' },
      recommendations: { type: 'array', description: 'GEO recommendations' },
      entityAnalysis: { type: 'object', description: 'Wiki/Wikidata and Graph metrics' },
      technicalAnalysis: { type: 'object', description: 'Markup/technical indicators' },
      summary: { type: 'string', description: 'GEO summary' },
      approvalStatus: { type: 'string', description: 'Agent approval status' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing GEO Audit for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        geoAuditId: `sim_geo_${Date.now()}`,
        geoScore: 89,
        healthLevel: 'good',
        entityConsistencyScore: 92,
        brandSentimentScore: 85,
        pagesProcessed: 5,
        technicalIssuesCount: 1,
        entityIssuesCount: 1,
        recommendationsCount: 2,
        recommendations: [],
        entityAnalysis: {},
        technicalAnalysis: {},
        summary: 'Simulation: GEO audit complete.',
        approvalStatus: 'Pending Approval'
      };
    }

    try {
      if (project) {
        await geoAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `GEO agent execution error: ${err.message}`);
    }

    const geoDoc = await WorkspaceGeoAudit.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!geoDoc) {
      return {
        success: false,
        error: 'GEO audit failed or no completed audit found.',
        geoAuditId: null
      };
    }

    // Load referenced technical analysis and entity analysis sub-documents
    let technicalAnalysis = {};
    let entityAnalysis = {};

    if (geoDoc.technicalAnalysisId) {
      try {
        technicalAnalysis = await WorkspaceGeoTechnicalAnalysis.findById(geoDoc.technicalAnalysisId).lean() || {};
      } catch (e) {
        logger.warn(TAG, `Failed to load WorkspaceGeoTechnicalAnalysis: ${e.message}`);
      }
    }

    if (geoDoc.entityAnalysisId) {
      try {
        entityAnalysis = await WorkspaceGeoEntityAnalysis.findById(geoDoc.entityAnalysisId).lean() || {};
      } catch (e) {
        logger.warn(TAG, `Failed to load WorkspaceGeoEntityAnalysis: ${e.message}`);
      }
    }

    const recs = geoDoc.agent?.recommendations || [];
    const technicalIssuesCount = (technicalAnalysis.issues || []).length || 0;
    const entityIssuesCount = (entityAnalysis.conflicts || []).length || 0;

    return {
      success: true,
      geoAuditId: geoDoc._id.toString(),
      geoScore: geoDoc.overallGeoScore ?? geoDoc.score ?? 0,
      healthLevel: geoDoc.healthLevel || 'poor',
      entityConsistencyScore: geoDoc.agent?.entityConsistencyScore ?? 0,
      brandSentimentScore: entityAnalysis.sentimentScore ?? 89,
      pagesProcessed: geoDoc.performance?.pagesProcessed || 0,
      technicalIssuesCount,
      entityIssuesCount,
      recommendationsCount: recs.length,
      recommendations: recs.map(r => ({
        scope: r.scope || 'sitewide',
        pageUrl: r.pageUrl || null,
        title: r.title || '',
        description: r.description || '',
        missingElements: r.missingElements || [],
        rationale: r.rationale || ''
      })),
      entityAnalysis: {
        wikidataPresence: entityAnalysis.wikidataPresence ?? false,
        wikipediaPresence: entityAnalysis.wikipediaPresence ?? false,
        googleGraphId: entityAnalysis.googleGraphId || null,
        conflicts: entityAnalysis.conflicts || [],
        sentimentScore: entityAnalysis.sentimentScore ?? null
      },
      technicalAnalysis: {
        organizationSchema: technicalAnalysis.organizationSchema ?? false,
        brandMentionDensity: technicalAnalysis.brandMentionDensity ?? 0,
        schemaValidationStatus: technicalAnalysis.schemaValidationStatus || 'unknown',
        issues: technicalAnalysis.issues || []
      },
      summary: geoDoc.agent?.summary || geoDoc.summary || '',
      approvalStatus: geoDoc.agent?.approvalStatus || '',
      completedAt: geoDoc.completedAt ? new Date(geoDoc.completedAt).toISOString() : null
    };
  }
};
