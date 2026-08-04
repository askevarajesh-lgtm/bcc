const competitorAgent = require('../competitorAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceCompetitor = require('../../models/workspaceCompetitor.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionAnalyzeCompetitors';

module.exports = {
  id: 'analyze_competitors',
  name: 'Analyze Competitor Intelligence',
  category: 'Competitor Analysis',
  icon: 'Crosshair',
  description: 'Discovers competitor domains, detects ranking overtakes, compares keyword overlap, and discovers backlink opportunities.',

  documentation: {
    overview: 'Runs competitive surveillance to identify rival domains taking SERP share and flags content gap opportunities.',
    inputsDoc: [
      { name: 'maxCompetitors', desc: 'Maximum number of competitor domains to analyze', type: 'number', default: 5 },
      { name: 'detectOvertakes', desc: 'Flag when competitor overtakes project rankings', type: 'boolean', default: true },
      { name: 'analyzeBacklinks', desc: 'Enrich competitor profile with backlink intersection data', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'competitorsAnalyzedCount', desc: 'Number of competitor domains evaluated', type: 'number' },
      { name: 'overtakesDetected', desc: 'Number of keywords where competitor ranks higher', type: 'number' },
      { name: 'contentGapsFound', desc: 'Count of high-volume keywords competitor ranks for but project does not', type: 'number' },
      { name: 'topCompetitors', desc: 'Array of top competitor domain names', type: 'array' },
      { name: 'competitors', desc: 'Full competitor profiles array with traffic, authority, keywords, backlinks, threat level', type: 'array' },
      { name: 'contentGaps', desc: 'Keyword content gap opportunities array', type: 'array' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 200, thirdPartyCalls: 2 },
  dependencies: [],
  permissions: ['seo:competitors:analyze'],

  getInputSchema() {
    return [
      { name: 'maxCompetitors', label: 'Max Competitors', type: 'number', defaultValue: 5, min: 1, max: 20 },
      { name: 'detectOvertakes', label: 'Detect Ranking Overtakes', type: 'switch', defaultValue: true },
      { name: 'analyzeBacklinks', label: 'Analyze Backlink Intersections', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      competitorsAnalyzedCount: { type: 'number', description: 'Total competitor domains processed' },
      overtakesDetected: { type: 'number', description: 'Ranking overtakes count' },
      contentGapsFound: { type: 'number', description: 'Keyword content gap count' },
      topCompetitors: { type: 'array', description: 'Array of top competitor domain names' },
      competitors: { type: 'array', description: 'Full competitor profile objects' },
      contentGaps: { type: 'array', description: 'Content gap keyword opportunities' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Competitor Analysis for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        competitorsAnalyzedCount: 3,
        overtakesDetected: 1,
        contentGapsFound: 0,
        topCompetitors: ['competitor1.com', 'competitor2.com', 'competitor3.com'],
        competitors: [],
        contentGaps: []
      };
    }

    try {
      if (project) {
        await competitorAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Competitor agent execution error: ${err.message}`);
    }

    const maxResults = Number(config.maxCompetitors) || 10;
    const competitors = await WorkspaceCompetitor.find({ projectId, isDeleted: { $ne: true } })
      .sort({ 'metrics.organicTraffic': -1 })
      .limit(maxResults)
      .lean();

    // Build full competitor profiles from production DB records
    const competitorProfiles = competitors.map(c => ({
      competitorId: c._id.toString(),
      domain: c.domain,
      threatLevel: c.agent?.threatLevel || c.threatLevel || 'medium',
      summary: c.agent?.summary || '',
      approvalStatus: c.agent?.approvalStatus || '',
      metrics: {
        organicTraffic: c.metrics?.organicTraffic || 0,
        organicKeywords: c.metrics?.organicKeywords || 0,
        domainRank: c.metrics?.domainRank || 0,
        referringDomains: c.metrics?.referringDomains || 0,
        backlinks: c.metrics?.backlinks || 0,
        commonKeywords: c.metrics?.commonKeywords || 0,
        organicCost: c.metrics?.organicCost || 0
      },
      contentGaps: c.agent?.contentGaps || [],
      overtakeAlerts: c.agent?.overtakeAlerts || [],
      rankingHistory: c.rankingHistory || [],
      dataSource: c.dataSource || 'dataforseo',
      lastAnalyzedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null
    }));

    // Aggregate stats
    const overtakesDetected = competitorProfiles.reduce(
      (sum, c) => sum + (c.overtakeAlerts?.length || 0), 0
    );
    const allContentGaps = competitorProfiles.flatMap(c => c.contentGaps || []);
    const highThreat = competitorProfiles.filter(c =>
      c.threatLevel === 'high' || c.threatLevel === 'critical'
    );

    return {
      success: true,
      competitorsAnalyzedCount: competitorProfiles.length,
      overtakesDetected,
      contentGapsFound: allContentGaps.length,
      topCompetitors: competitorProfiles.slice(0, 5).map(c => c.domain),
      highThreatCount: highThreat.length,
      competitors: competitorProfiles,
      contentGaps: allContentGaps
    };
  }
};
