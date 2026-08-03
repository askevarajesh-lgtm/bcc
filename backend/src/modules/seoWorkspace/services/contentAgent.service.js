const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceContentBrief = require('../models/workspaceContentBrief.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'content-agent';
const TAG = 'ContentAgent';

const VALID_CONTENT_TYPES = ['blog_post', 'landing_page', 'pillar_page', 'product_page'];
const VALID_ACTIONS = ['new_page', 'update_existing'];
const MAX_CANDIDATE_KEYWORDS = 25;
const MAX_BRIEFS = 10;
const EXISTING_PAGES_CRAWL_LIMIT = 15; // small, targeted pass for new-vs-update context — not a full content crawl

/**
 * @param {Object} project - a WorkspaceProject document
 * @param {string} agencyId
 * @returns {Promise<{ candidateKeywords: Array, existingPages: Array, dataSource: string }>}
 */
async function collectContentInputs(project, agencyId) {
  const [approvedKeywords, briefedDocs] = await Promise.all([
    WorkspaceKeyword.find({ projectId: project._id, status: 'Approved', isDeleted: false })
      .sort({ 'metrics.searchVolume': -1 })
      .limit(MAX_CANDIDATE_KEYWORDS * 2) // headroom before filtering out already-briefed keywords
      .lean(),
    WorkspaceContentBrief.find({ projectId: project._id, 'agent.approvalStatus': { $ne: 'Rejected' } })
      .select('agent.briefs.targetKeyword agent.briefs.secondaryKeywords')
      .lean()
  ]);

  const alreadyBriefed = new Set(
    briefedDocs.flatMap((doc) => (doc.agent?.briefs || []).flatMap((b) => [b.targetKeyword, ...(b.secondaryKeywords || [])]))
      .filter(Boolean)
      .map((k) => k.toLowerCase())
  );

  const candidateKeywords = approvedKeywords
    .filter((k) => !alreadyBriefed.has(k.keyword.toLowerCase()))
    .slice(0, MAX_CANDIDATE_KEYWORDS)
    .map((k) => ({
      keyword: k.keyword,
      searchVolume: k.metrics?.searchVolume || 0,
      keywordDifficulty: k.metrics?.keywordDifficulty || 0,
      intent: k.metrics?.intent || 'unknown'
    }));

  let existingPages = [];
  let dataSource = 'internal-only';
  if (candidateKeywords.length > 0) {
    try {
      const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;
      const crawlResult = await retry.withRetry(
        () => new CrawlService(rootUrl, EXISTING_PAGES_CRAWL_LIMIT).run(),
        {
          retries: 1,
          onRetry: (error, attempt) => logger.warn(TAG, `existing-pages crawl retry ${attempt + 1}: ${error.message}`)
        }
      );
      existingPages = (crawlResult.pages || [])
        .filter((p) => p.status === 200 && p.title)
        .map((p) => ({ url: p.final_url || p.url, title: p.title }));
      if (existingPages.length > 0) dataSource = 'crawl';
    } catch (error) {
      logger.warn(TAG, `Existing-pages crawl failed for project ${project._id}, continuing with an empty list: ${error.message}`, { projectId: project._id });
    }
  }

  return { candidateKeywords, existingPages, dataSource };
}

/**
 * @param {Object} project
 * @param {Array} candidateKeywords - from collectContentInputs
 * @param {Array} existingPages - from collectContentInputs
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, briefs: Array }>}
 */
async function analyzeAndGenerateBriefs(project, candidateKeywords, existingPages, workspaceId) {
  if (candidateKeywords.length === 0) {
    return { summary: 'No Approved keywords without an existing content brief were available to analyze.', briefs: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const targetCount = Math.min(MAX_BRIEFS, candidateKeywords.length);

  const prompt = `You are the Content Agent for ${project.name} (${project.domain}).

Candidate Keywords (already human-approved; metrics of 0/"unknown" mean no measured data was available — treat these conservatively):
${JSON.stringify(candidateKeywords, null, 2)}

Existing Pages (only these URLs may be used as a targetUrl for "update_existing" — do not invent one):
${JSON.stringify(existingPages, null, 2)}
${skillsBlock}
${memoryBlock}

Cluster the candidate keywords by shared topic/intent, then produce up to ${targetCount} content briefs — one per cluster. Do not invent keywords or URLs that aren't in the lists above.

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of the overall content opportunity",
  "briefs": [
    {
      "title": "...",
      "contentType": "blog_post" | "landing_page" | "pillar_page" | "product_page",
      "targetKeyword": "must exactly match one candidate keyword above",
      "secondaryKeywords": ["must exactly match other candidate keywords above"],
      "recommendedAction": "new_page" | "update_existing",
      "targetUrl": "must exactly match one existing page URL above, or null if recommendedAction is new_page",
      "outline": ["section heading 1", "section heading 2", "..."],
      "metaTitle": "...",
      "metaDescription": "...",
      "wordCountTarget": 800,
      "theme": "short cluster label",
      "rationale": "1-2 sentences"
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
    temperature: 0.5,
    maxTokens: 2400,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI content-brief JSON: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated analysis did not return structured output; manual review recommended.', briefs: [] };
  }

  const candidateMap = new Map(candidateKeywords.map((c) => [c.keyword.toLowerCase(), c.keyword]));
  const existingUrlSet = new Set(existingPages.map((p) => p.url));

  const briefs = (Array.isArray(parsed.briefs) ? parsed.briefs : [])
    .filter((b) => b.targetKeyword && candidateMap.has(b.targetKeyword.toLowerCase()))
    .slice(0, MAX_BRIEFS)
    .map((b) => {
      const recommendedAction = VALID_ACTIONS.includes(b.recommendedAction) ? b.recommendedAction : 'new_page';
      const targetUrl = recommendedAction === 'update_existing' && existingUrlSet.has(b.targetUrl) ? b.targetUrl : null;
      const secondaryKeywords = Array.isArray(b.secondaryKeywords)
        ? b.secondaryKeywords.filter((k) => typeof k === 'string' && candidateMap.has(k.toLowerCase())).map((k) => candidateMap.get(k.toLowerCase()))
        : [];
      const wordCountTarget = Number(b.wordCountTarget);

      return {
        title: b.title || `Content for ${candidateMap.get(b.targetKeyword.toLowerCase())}`,
        contentType: VALID_CONTENT_TYPES.includes(b.contentType) ? b.contentType : 'blog_post',
        targetKeyword: candidateMap.get(b.targetKeyword.toLowerCase()), // preserve original casing from the candidate, not the AI's echo
        secondaryKeywords,
        recommendedAction,
        targetUrl,
        outline: Array.isArray(b.outline) ? b.outline.filter((s) => typeof s === 'string' && s.trim()) : [],
        metaTitle: b.metaTitle || '',
        metaDescription: b.metaDescription || '',
        wordCountTarget: Number.isFinite(wordCountTarget) && wordCountTarget > 0 ? Math.round(wordCountTarget) : null,
        theme: b.theme || 'general',
        rationale: b.rationale || ''
      };
    });

  return { summary: parsed.summary || '', briefs };
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the created WorkspaceContentBrief document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`content-agent:${projectId}`, async () => {
    const executionId = `contentAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'contentAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { candidateKeywords, existingPages, dataSource } = await collectContentInputs(project, agencyId);
      const { summary, briefs } = await analyzeAndGenerateBriefs(project, candidateKeywords, existingPages, agencyId);

      const contentBrief = await WorkspaceContentBrief.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { candidateKeywords, existingPages, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          briefs,
          approvalStatus: briefs.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'contentAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { contentBriefId: contentBrief._id, candidateCount: candidateKeywords.length, briefCount: briefs.length }
      });

      return contentBrief;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'contentAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} contentBriefId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveBriefs(contentBriefId, projectId, userId) {
  const contentBrief = await WorkspaceContentBrief.findOne({ _id: contentBriefId, projectId });
  if (!contentBrief) throw new Error('Content brief run not found');

  if (!contentBrief.agent || contentBrief.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Briefs must be 'Pending Approval' to approve. Current status is '${contentBrief.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  contentBrief.agent.approvalStatus = 'Approved';
  contentBrief.agent.approvedBy = userId;
  contentBrief.agent.approvedAt = new Date();
  contentBrief.agent.rejectionReason = null;

  const tasksToCreate = (contentBrief.agent.briefs || []).map((b) => ({
    projectId,
    pageUrl: b.recommendedAction === 'update_existing' && b.targetUrl ? b.targetUrl : '/',
    taskType: 'Content Edit',
    description: `[Content Agent] ${b.title} — target keyword "${b.targetKeyword}"`,
    proposedChanges: {
      contentType: b.contentType,
      targetKeyword: b.targetKeyword,
      secondaryKeywords: b.secondaryKeywords,
      recommendedAction: b.recommendedAction,
      outline: b.outline,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      wordCountTarget: b.wordCountTarget
    },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    contentBrief.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await contentBrief.save();

  auditLogService.record({
    targetType: 'ContentBrief', targetId: contentBrief._id, projectId,
    action: 'content_briefs_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { contentBrief, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectBriefs(contentBriefId, projectId, userId, reason) {
  const contentBrief = await WorkspaceContentBrief.findOne({ _id: contentBriefId, projectId });
  if (!contentBrief) throw new Error('Content brief run not found');

  if (!contentBrief.agent || contentBrief.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Briefs must be 'Pending Approval' to reject. Current status is '${contentBrief.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  contentBrief.agent.approvalStatus = 'Rejected';
  contentBrief.agent.rejectionReason = reason || null;
  await contentBrief.save();

  auditLogService.record({
    targetType: 'ContentBrief', targetId: contentBrief._id, projectId,
    action: 'content_briefs_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedThemesIfRepeated(contentBrief, projectId, userId);

  return contentBrief;
}

async function recordExcludedThemesIfRepeated(contentBrief, projectId, userId) {
  try {
    const themes = [...new Set((contentBrief.agent?.briefs || []).map((b) => b.theme).filter(Boolean))];
    if (themes.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const theme of themes.slice(0, 3)) {
      const priorRejectionCount = await WorkspaceContentBrief.countDocuments({
        projectId, 'agent.approvalStatus': 'Rejected', 'agent.briefs.theme': theme
      });

      if (priorRejectionCount >= 2) {
        await sharedMemory.remember({
          agencyId,
          projectId,
          title: `Excluded content theme: ${theme}`,
          description: `Content briefs themed "${theme}" have been rejected ${priorRejectionCount} times for this project.`,
          content: `Avoid suggesting further content briefs in the "${theme}" theme unless explicitly requested.`,
          type: 'do_not_do'
        });
      }
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-content-theme memory for project ${projectId}: ${error.message}`, { projectId });
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'contentAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectContentInputs,
  analyzeAndGenerateBriefs,
  approveBriefs,
  rejectBriefs,
  getExecutionHistory
};
