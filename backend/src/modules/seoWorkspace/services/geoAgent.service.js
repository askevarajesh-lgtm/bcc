const crypto = require('crypto');
const WorkspaceProject = require('../models/workspaceProject.model');
const { 
  WorkspaceGeoAudit,
  WorkspaceGeoPageAnalysis,
  WorkspaceGeoTechnicalAnalysis,
  WorkspaceGeoEntityAnalysis
} = require('../models/workspaceGeoAuditAsset.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');

const analyzerRegistry = require('./geo/analyzerRegistry');
const scoreEngine = require('./geo/scoreEngine');
const recommendationEngine = require('./geo/recommendationEngine');
const geoPromptBuilder = require('./geo/geoPromptBuilder');

const AGENT_KEY = 'geo-agent';
const TAG = 'GeoAgent';
const GEO_CRAWL_PAGE_LIMIT = 25;

async function collectGeoSignals(project) {
  const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;

  const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, GEO_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
    .catch((error) => {
      logger.warn(TAG, `Site-wide signal crawl failed for ${rootUrl}, continuing with an empty page set: ${error.message}`, { projectId: project._id });
      return { pages: [] };
    });

  const pages = (crawlResult.pages || [])
    .filter((p) => p.status === 200 && p.indexable !== false)
    .map((p) => ({
      url: p.final_url || p.url,
      title: p.title || '',
      metaDescription: p.meta_description || '',
      h1: p.h1 || '',
      headings: Array.isArray(p.headings) ? p.headings : [],
      wordCount: p.word_count || 0,
      hasExistingFaqSchema: !!p.hasExistingFaqSchema,
      schemas: Array.isArray(p.schemas) ? p.schemas : [],
      indexable: p.indexable !== false,
      hash: crypto.createHash('md5').update((p.title || '') + (p.meta_description || '') + (p.h1 || '')).digest('hex')
    }));

  return { pages, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`geo-agent:${projectId}`, async () => {
    const executionId = `geoAgent:${projectId}:${Date.now()}`;
    const startTime = Date.now();

    logger.logExecution({ executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    // 1. Create audit record tracking progress
    const audit = await WorkspaceGeoAudit.create({
      projectId: project._id,
      agencyId,
      status: 'in_progress',
      progress: { stage: 'Crawling', percent: 10 }
    });

    try {
      // 2. Crawl
      const { pages: pageSignals, dataSource } = await collectGeoSignals(project);
      
      audit.inputs = { pages: pageSignals, dataSource };
      audit.progress = { stage: 'Analyzing', percent: 40 };
      await audit.save();

      // 3. Run Deterministic Analyzers
      const context = { projectId: project._id, hasRobotsTxt: true, hasSitemapXml: true };
      const analyzerResults = await analyzerRegistry.runAll(pageSignals, context);

      // 4. Calculate deterministic scores & deduplicate recommendations
      const { overallScore, healthLevel, breakdown } = scoreEngine.computeOverallScore(analyzerResults);
      const rawRecommendations = recommendationEngine.process(analyzerResults);

      audit.progress = { stage: 'AI Interpretation', percent: 80 };
      await audit.save();

      // 5. AI Interpretation
      const { aiSummary, enhancedRecommendations } = await geoPromptBuilder.buildAndExecute(project, analyzerResults, rawRecommendations, agencyId);

      // 6. Persistence: Populate modular child collections
      const pageDocs = pageSignals.map(p => ({
        auditId: audit._id,
        projectId: project._id,
        url: p.url,
        contentHash: p.hash,
        schemaScore: breakdown.schema?.score || null,
        contentScore: breakdown.content?.score || null,
        authorityScore: breakdown.authority?.score || null,
        evidence: [] // Simplified for now
      }));
      const insertedPages = await WorkspaceGeoPageAnalysis.insertMany(pageDocs);

      const techDoc = await WorkspaceGeoTechnicalAnalysis.create({
        auditId: audit._id,
        projectId: project._id,
        overallTechnicalScore: breakdown.technical?.score || null,
        metrics: { hasRobotsTxt: true, hasSitemapXml: true, brokenCanonicalCount: 0, nonIndexableCount: 0 }
      });

      const entityDoc = await WorkspaceGeoEntityAnalysis.create({
        auditId: audit._id,
        projectId: project._id,
        overallEntityScore: breakdown.entity?.score || null,
        knowledgeGraphScore: breakdown.knowledgeGraph?.score || null,
        entities: []
      });

      // 7. Complete Audit
      const totalRuntimeMs = Date.now() - startTime;
      
      audit.status = 'completed';
      audit.progress = { stage: 'Completed', percent: 100 };
      audit.completedAt = new Date();
      audit.overallGeoScore = overallScore;
      audit.healthLevel = healthLevel;
      audit.scoreBreakdown = breakdown;
      audit.performance = { totalRuntimeMs, pagesProcessed: pageSignals.length, pagesCached: 0 };
      audit.pageAnalysisIds = insertedPages.map(p => p._id);
      audit.technicalAnalysisId = techDoc._id;
      audit.entityAnalysisId = entityDoc._id;
      
      audit.agent = {
        agentKey: AGENT_KEY,
        summary: aiSummary,
        entityConsistencyScore: breakdown.entity?.score || overallScore, // For backwards compatibility
        recommendations: enhancedRecommendations.map(r => ({
          scope: r.page === 'sitewide' ? 'sitewide' : 'page',
          pageUrl: r.page === 'sitewide' ? null : r.page,
          title: r.title,
          description: r.description,
          missingElements: [],
          rationale: r.description,
          priority: r.priority
        })),
        approvalStatus: enhancedRecommendations.length > 0 ? 'Pending Approval' : 'Not Requested'
      };

      await audit.save();

      logger.logExecution({
        executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: totalRuntimeMs,
        meta: { auditId: audit._id, recommendationCount: enhancedRecommendations.length }
      });

      return audit;
    } catch (error) {
      audit.status = 'failed';
      audit.progress = { stage: 'Failed', percent: 100 };
      await audit.save();

      logger.logExecution({
        executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startTime, error: error.message
      });
      throw error;
    }
  });
}

// ... preserving approve/reject logic for backward compatibility ...
async function approveGeoRecommendations(auditId, projectId, userId) {
  const audit = await WorkspaceGeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('GEO audit run not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: GEO audit must be 'Pending Approval' to approve.`);
  }

  audit.agent.approvalStatus = 'Approved';
  audit.agent.approvedBy = userId;
  audit.agent.approvedAt = new Date();
  audit.agent.rejectionReason = null;

  const fallbackPageUrl = audit.inputs?.pages?.[0]?.url || 'sitewide';
  const tasksToCreate = (audit.agent.recommendations || []).map((r) => ({
    projectId,
    pageUrl: r.pageUrl || fallbackPageUrl,
    taskType: 'GEO Optimization',
    description: `[GEO Agent] ${r.title}${r.description ? ` — ${r.description}` : ''}`,
    proposedChanges: { scope: r.scope, missingElements: [] },
    status: 'Pending'
  }));

  if (tasksToCreate.length > 0) {
    const createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    audit.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await audit.save();

  auditLogService.record({
    targetType: 'GeoAudit', targetId: audit._id, projectId,
    action: 'geo_audit_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { audit, createdTasks: audit.agent.generatedTaskIds };
}

async function rejectGeoRecommendations(auditId, projectId, userId, reason) {
  const audit = await WorkspaceGeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('GEO audit run not found');

  audit.agent.approvalStatus = 'Rejected';
  audit.agent.rejectionReason = reason || null;
  await audit.save();

  auditLogService.record({
    targetType: 'GeoAudit', targetId: audit._id, projectId,
    action: 'geo_audit_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  return audit;
}

async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');
  return ExecutionLog.find({ projectId, $or: [{ agentKey: AGENT_KEY }, { source: 'geoAgent' }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectGeoSignals,
  approveGeoRecommendations,
  rejectGeoRecommendations,
  getExecutionHistory
};
