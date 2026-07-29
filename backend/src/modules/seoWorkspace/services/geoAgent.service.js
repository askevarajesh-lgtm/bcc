const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceGeoAudit = require('../models/workspaceGeoAudit.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'geo-agent';
const TAG = 'GeoAgent';

const GEO_CRAWL_PAGE_LIMIT = 25; // site-wide signal, so a wider crawl than AEO's per-page pass
const MAX_PAGES_FOR_PROMPT = 15;

/**
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ pages: Array, dataSource: string }>}
 */
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
      indexable: p.indexable !== false
    }));

  return { pages, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

/**
 * @param {Object} project
 * @param {Array} pages - from collectGeoSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, entityConsistencyScore: number|null, recommendations: Array }>}
 */
async function generateGeoRecommendations(project, pages, workspaceId) {
  if (pages.length === 0) {
    return { summary: 'No indexable pages were available to assess entity/schema consistency for.', entityConsistencyScore: null, recommendations: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const candidatePages = pages.slice(0, MAX_PAGES_FOR_PROMPT);

  const prompt = `You are the GEO Agent for ${project.name} (${project.domain}). Judge how consistently this entire site — not any single page — resolves as one identifiable entity for generative engines (ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews) to surface and correctly attribute, based only on the pages given below. Do not invent facts, entity names, or schema data that isn't reflected in the page signals.

Pages (word counts of 0 mean the crawl couldn't read body content — treat conservatively):
${JSON.stringify(candidatePages, null, 2)}
${skillsBlock}
${memoryBlock}

Only reference URLs from the list above when a recommendation is page-scoped — do not invent a page URL. Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of the site's overall generative-engine entity consistency",
  "entityConsistencyScore": 0-100 integer per the skill's scoring guidance,
  "recommendations": [
    {
      "scope": "sitewide" or "page",
      "pageUrl": "must exactly match one url above if scope is page, otherwise null",
      "title": "short recommendation title",
      "description": "1-3 sentence grounded recommendation",
      "missingElements": ["short phrases describing what's missing, e.g. 'no Organization schema on homepage'"],
      "rationale": "1-2 sentence justification grounded in the page signals given"
    }
  ]
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 2500,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI GEO-generation JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', entityConsistencyScore: null, recommendations: [] };
  }

  const candidateUrls = new Set(candidatePages.map((p) => p.url));
  const rawScore = Number(parsed.entityConsistencyScore);
  const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
    .filter((r) => r && r.title && (r.scope !== 'page' || candidateUrls.has(r.pageUrl)))
    .slice(0, 20)
    .map((r) => ({
      scope: r.scope === 'page' ? 'page' : 'sitewide',
      pageUrl: r.scope === 'page' ? r.pageUrl : null,
      title: String(r.title),
      description: typeof r.description === 'string' ? r.description : '',
      missingElements: Array.isArray(r.missingElements) ? r.missingElements.slice(0, 10).map(String) : [],
      rationale: r.rationale || ''
    }));

  return {
    summary: parsed.summary || '',
    entityConsistencyScore: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : null,
    recommendations
  };
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceGeoAudit document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`geo-agent:${projectId}`, async () => {
    const executionId = `geoAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { pages: pageSignals, dataSource } = await collectGeoSignals(project);
      const { summary, entityConsistencyScore, recommendations } = await generateGeoRecommendations(project, pageSignals, agencyId);

      const audit = await WorkspaceGeoAudit.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { pages: pageSignals, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          entityConsistencyScore,
          recommendations,
          approvalStatus: recommendations.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { auditId: audit._id, recommendationCount: recommendations.length }
      });

      return audit;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'geoAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} auditId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveGeoRecommendations(auditId, projectId, userId) {
  const audit = await WorkspaceGeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('GEO audit run not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: GEO audit must be 'Pending Approval' to approve. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Approved';
  audit.agent.approvedBy = userId;
  audit.agent.approvedAt = new Date();
  audit.agent.rejectionReason = null;

  // WorkspaceTask requires a pageUrl; sitewide recommendations have none, so fall back to the first known page/domain.
  const fallbackPageUrl = audit.inputs?.pages?.[0]?.url || 'sitewide';

  const tasksToCreate = (audit.agent.recommendations || []).map((r) => ({
    projectId,
    pageUrl: r.pageUrl || fallbackPageUrl,
    taskType: 'GEO Optimization',
    description: `[GEO Agent] ${r.title}${r.description ? ` — ${r.description}` : ''}${r.missingElements?.length ? ` — missing: ${r.missingElements.join(', ')}` : ''}`,
    proposedChanges: {
      scope: r.scope,
      entityConsistencyScore: audit.agent.entityConsistencyScore,
      missingElements: r.missingElements
    },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    audit.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await audit.save();

  auditLogService.record({
    targetType: 'GeoAudit', targetId: audit._id, projectId,
    action: 'geo_audit_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { audit, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectGeoRecommendations(auditId, projectId, userId, reason) {
  const audit = await WorkspaceGeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('GEO audit run not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`GEO audit must be 'Pending Approval' to reject. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Rejected';
  audit.agent.rejectionReason = reason || null;
  await audit.save();

  auditLogService.record({
    targetType: 'GeoAudit', targetId: audit._id, projectId,
    action: 'geo_audit_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedRecommendationsIfAny(audit, projectId, userId, reason);

  return audit;
}

async function recordExcludedRecommendationsIfAny(audit, projectId, userId, reason) {
  try {
    const recommendations = audit.agent?.recommendations || [];
    if (recommendations.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const rec of recommendations.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Rejected GEO recommendation: ${rec.title}`,
        description: `The GEO Agent's entity/schema-consistency recommendation "${rec.title}" was rejected.`,
        content: reason
          ? `Do not propose the same GEO recommendation "${rec.title}" again. Reason given: ${reason}`
          : `Do not propose the same GEO recommendation "${rec.title}" again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-GEO-recommendation memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * @param {string} projectId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'geoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectGeoSignals,
  generateGeoRecommendations,
  approveGeoRecommendations,
  rejectGeoRecommendations,
  getExecutionHistory
};
