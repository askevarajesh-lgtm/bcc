const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceAeoAudit = require('../models/workspaceAeoAudit.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'aeo-agent';
const TAG = 'AeoAgent';

const AEO_CRAWL_PAGE_LIMIT = 15; 
const MAX_PAGES_PER_RUN = 10; 

/**
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ pages: Array, dataSource: string }>}
 */
async function collectAeoSignals(project) {
  const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;

  const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, AEO_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
    .catch((error) => {
      logger.warn(TAG, `Page-signal crawl failed for ${rootUrl}, continuing with an empty page set: ${error.message}`, { projectId: project._id });
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
      listCount: p.listCount || 0,
      tableCount: p.tableCount || 0,
      hasExistingFaqSchema: !!p.hasExistingFaqSchema,
      indexable: p.indexable !== false
    }));

  return { pages, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

/**
 * @param {Object} project
 * @param {Array} pages - from collectAeoSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, pages: Array }>}
 */
async function generateAeoRecommendations(project, pages, workspaceId) {
  if (pages.length === 0) {
    return { summary: 'No indexable pages were available to generate AEO recommendations for.', pages: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const candidatePages = pages.slice(0, MAX_PAGES_PER_RUN);

  const prompt = `You are the AEO Agent for ${project.name} (${project.domain}). Judge how ready each page below is to be extracted from and cited by an AI answer engine (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot), based only on what's actually given — do not invent facts, statistics, or claims that aren't reflected in the page's title/meta description/H1/headings.

Pages (word counts of 0 mean the crawl couldn't read body content — treat conservatively; listCount/tableCount/hasExistingFaqSchema are objective, code-measured signals):
${JSON.stringify(candidatePages, null, 2)}
${skillsBlock}
${memoryBlock}

Only propose recommendations for pages in the list above — do not invent a page URL. Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of the overall AEO opportunity across these pages",
  "pages": [
    {
      "pageUrl": "must exactly match one url above",
      "aeoReadinessScore": 0-100 integer per the skill's scoring guidance,
      "directAnswerSuggestion": "a grounded 40-60 word direct-answer snippet for the top of the page, or empty string if not enough signal to write one",
      "suggestedFaqBlock": [{ "question": "...", "answer": "..." }],
      "missingElements": ["short phrases describing what's missing, e.g. 'no question-format subheadings'"],
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
    logger.error(TAG, `Failed to parse AI AEO-generation JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', pages: [] };
  }

  const candidateUrls = new Set(candidatePages.map((p) => p.url));
  const generatedPages = (Array.isArray(parsed.pages) ? parsed.pages : [])
    .filter((p) => p.pageUrl && candidateUrls.has(p.pageUrl))
    .slice(0, MAX_PAGES_PER_RUN)
    .map((p) => {
      const rawScore = Number(p.aeoReadinessScore);
      return {
        pageUrl: p.pageUrl,
        aeoReadinessScore: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : null,
        directAnswerSuggestion: typeof p.directAnswerSuggestion === 'string' ? p.directAnswerSuggestion : '',
        suggestedFaqBlock: Array.isArray(p.suggestedFaqBlock)
          ? p.suggestedFaqBlock
            .filter((f) => f && f.question && f.answer)
            .slice(0, 8)
            .map((f) => ({ question: String(f.question), answer: String(f.answer) }))
          : [],
        missingElements: Array.isArray(p.missingElements) ? p.missingElements.slice(0, 10).map(String) : [],
        rationale: p.rationale || ''
      };
    });

  return { summary: parsed.summary || '', pages: generatedPages };
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceAeoAudit document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`aeo-agent:${projectId}`, async () => {
    const executionId = `aeoAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { pages: pageSignals, dataSource } = await collectAeoSignals(project);
      const { summary, pages } = await generateAeoRecommendations(project, pageSignals, agencyId);

      const audit = await WorkspaceAeoAudit.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { pages: pageSignals, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          pages,
          approvalStatus: pages.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { auditId: audit._id, pageCount: pages.length }
      });

      return audit;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId,
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
async function approveAeoRecommendations(auditId, projectId, userId) {
  const audit = await WorkspaceAeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('AEO audit run not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: AEO audit must be 'Pending Approval' to approve. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Approved';
  audit.agent.approvedBy = userId;
  audit.agent.approvedAt = new Date();
  audit.agent.rejectionReason = null;

  const tasksToCreate = (audit.agent.pages || []).map((p) => ({
    projectId,
    pageUrl: p.pageUrl,
    taskType: 'AEO Optimization',
    description: `[AEO Agent] Improve answer-engine readiness for ${p.pageUrl}${p.aeoReadinessScore !== null && p.aeoReadinessScore !== undefined ? ` (score: ${p.aeoReadinessScore}/100)` : ''}${p.missingElements?.length ? ` — missing: ${p.missingElements.join(', ')}` : ''}`,
    proposedChanges: {
      aeoReadinessScore: p.aeoReadinessScore,
      directAnswerSuggestion: p.directAnswerSuggestion,
      suggestedFaqBlock: p.suggestedFaqBlock,
      missingElements: p.missingElements
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
    targetType: 'AeoAudit', targetId: audit._id, projectId,
    action: 'aeo_audit_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { audit, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectAeoRecommendations(auditId, projectId, userId, reason) {
  const audit = await WorkspaceAeoAudit.findOne({ _id: auditId, projectId });
  if (!audit) throw new Error('AEO audit run not found');

  if (!audit.agent || audit.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`AEO audit must be 'Pending Approval' to reject. Current status is '${audit.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  audit.agent.approvalStatus = 'Rejected';
  audit.agent.rejectionReason = reason || null;
  await audit.save();

  auditLogService.record({
    targetType: 'AeoAudit', targetId: audit._id, projectId,
    action: 'aeo_audit_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedPagesIfAny(audit, projectId, userId, reason);

  return audit;
}

async function recordExcludedPagesIfAny(audit, projectId, userId, reason) {
  try {
    const pages = audit.agent?.pages || [];
    if (pages.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const page of pages.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Rejected AEO recommendation: ${page.pageUrl}`,
        description: `The AEO Agent's answer-readiness recommendation for ${page.pageUrl} was rejected.`,
        content: reason
          ? `Do not propose the same AEO recommendation for ${page.pageUrl} again. Reason given: ${reason}`
          : `Do not propose the same AEO recommendation for ${page.pageUrl} again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-AEO-page memory for project ${projectId}: ${error.message}`, { projectId });
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'aeoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectAeoSignals,
  generateAeoRecommendations,
  approveAeoRecommendations,
  rejectAeoRecommendations,
  getExecutionHistory
};
