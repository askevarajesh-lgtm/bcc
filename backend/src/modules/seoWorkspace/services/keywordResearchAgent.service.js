const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const keywordIntelligence = require('./keywordIntelligence.service');
const providerChain = require('../providers/keywordProviderChain');
const auditLogService = require('./auditLog.service');
const recommendationMemory = require('./recommendationMemory.service');
const { keywordEvents, EVENTS } = require('../events/keywordEvents');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');
const axios = require('axios');
const hybridKeywordExtractor = require('./hybridKeywordExtractor.service');

const AGENT_KEY = 'keyword-research';
const TAG = 'KeywordResearchAgent';

const MAX_CANDIDATES = 40;
const MAX_SUGGESTIONS = 15;
const DEFAULT_LOCATION_CODE = 2840; // US, matches WorkspaceKeyword's own default
const DEFAULT_LANGUAGE_CODE = 'en';

/**
 * @param {Object} project - a WorkspaceProject document
 * @param {string} agencyId
 * @param {string} [seedKeyword] - explicit seed; defaults to the project's name
 * @returns {Promise<Array>} candidate objects: { keyword, searchVolume, cpc, competition, intent, keywordDifficulty }
 */
async function collectKeywordCandidates(project, agencyId, seedKeyword) {
  const seed = (seedKeyword || project.name || project.domain || '').trim();
  
  // 1. First, try to fetch existing keywords discovered by the background crawler in the database
  const dbKeywords = await WorkspaceKeyword.find({ 
    projectId: project._id, 
    source: 'discovery_crawler' 
  })
  .sort({ 'agent.opportunityScore': -1 })
  .limit(MAX_CANDIDATES)
  .lean();

  if (dbKeywords && dbKeywords.length > 0) {
    logger.info(TAG, `Found ${dbKeywords.length} deterministic crawler keywords in DB for "${seed}"`);
    return dbKeywords.map((k) => ({
      keyword: k.keyword,
      searchVolume: k.metrics?.searchVolume || 0,
      cpc: k.metrics?.cpc || 0,
      competition: k.metrics?.competition || 0,
      intent: k.metrics?.intent || 'unknown',
      keywordDifficulty: k.metrics?.keywordDifficulty || 0
    }));
  }

  // 2. If the DB is empty (i.e. the crawler literally just started), synchronously scrape the homepage right now!
  try {
    const siteUrl = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
    logger.info(TAG, `DB empty. Synchronously scraping homepage for instant candidates: ${siteUrl}`);
    
    const response = await axios.get(siteUrl, { timeout: 10000, maxRedirects: 3 });
    const html = response.data;
    
    const rawKeywords = hybridKeywordExtractor.extractFromHtml(html, siteUrl);
    
    const keywordQuality = require('./keywordQuality.service');
    const keywordIntent = require('./keywordIntent.service');
    const keywordOpportunity = require('./keywordOpportunity.service');

    const validKeywords = [];
    
    for (const k of rawKeywords) {
      const quality = keywordQuality.assessQuality(k.keyword, { searchVolume: 0 });
      if (quality.isRejected) continue;
      
      const intentData = keywordIntent.classify(k.keyword);
      const opportunity = keywordOpportunity.calculateOpportunity({
        searchVolume: 0,
        keywordDifficulty: 0,
        cpc: 0,
        currentRank: null,
        intent: intentData.intent
      });

      validKeywords.push({
        keyword: k.keyword,
        searchVolume: 0,
        cpc: 0,
        competition: 0,
        intent: intentData.intent,
        keywordDifficulty: 0,
        opportunityScore: opportunity.score
      });
    }

    // Sort by opportunity score and take the top ones
    validKeywords.sort((a, b) => b.opportunityScore - a.opportunityScore);
    return validKeywords.slice(0, MAX_CANDIDATES);
  } catch (error) {
    logger.error(TAG, `Synchronous scrape failed for instant candidates: ${error.message}`);
  }

  return [];
}

/**
 * @param {Object} project
 * @param {Array} candidates - from collectKeywordCandidates
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, selected: Array }>}
 */
async function analyzeAndSuggest(project, candidates, workspaceId) {
  if (candidates.length === 0) {
    return { summary: 'No keyword candidates were available to analyze.', selected: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const recommendationHistoryBlock = await recommendationMemory.recallAsPromptContext(project._id);
  const targetCount = Math.min(MAX_SUGGESTIONS, candidates.length);

  const prompt = `You are the Keyword Research Agent for ${project.name} (${project.domain}).

Candidate Keywords (metrics of 0/"unknown" mean no measured data was available — treat these conservatively, do not assume they're bad or good):
${JSON.stringify(candidates, null, 2)}
${skillsBlock}
${memoryBlock}
${recommendationHistoryBlock}

Select the best ${targetCount} keywords from the candidate list above to actively pursue. Do not invent keywords that aren't in the list.

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of the overall opportunity",
  "keywords": [
    { "keyword": "must exactly match one candidate above", "opportunityScore": 0-100, "rationale": "...", "theme": "short grouping label" }
  ]
}
Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.4,
    maxTokens: 1800,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI keyword-selection JSON: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated analysis did not return structured output; manual review recommended.', keywords: [] };
  }

  const candidateMap = new Map(candidates.map((c) => [c.keyword.toLowerCase(), c]));
  const selected = (Array.isArray(parsed.keywords) ? parsed.keywords : [])
    .filter((k) => k.keyword && candidateMap.has(k.keyword.toLowerCase()))
    .slice(0, MAX_SUGGESTIONS)
    .map((k) => {
      const candidate = candidateMap.get(k.keyword.toLowerCase());
      const score = Number(k.opportunityScore);
      return {
        ...candidate,
        keyword: candidate.keyword, // preserve original casing from the candidate, not the AI's echo
        opportunityScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
        rationale: k.rationale || '',
        theme: k.theme || 'general'
      };
    });

  return { summary: parsed.summary || '', selected };
}

const WorkspaceCrawlJob = require('../models/workspaceCrawlJob.model');
const WorkspaceCrawlQueue = require('../models/workspaceCrawlQueue.model');

async function run(projectId, workspaceId, options = {}) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  // 1. Kick off the background crawl (fire and forget)
  try {
    const existingJob = await WorkspaceCrawlJob.findOne({ projectId: project._id, status: 'running' });
    if (!existingJob) {
      const job = await WorkspaceCrawlJob.create({
        projectId: project._id,
        agencyId,
        status: 'running',
        startedAt: new Date(),
        progress: { pagesCrawled: 0, keywordsExtracted: 0, duplicatesRemoved: 0, keywordsSaved: 0 }
      });

      const siteUrl = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
      await WorkspaceCrawlQueue.create({
        jobId: job._id,
        url: siteUrl,
        status: 'pending'
      });

      const crawlWorker = require('./crawler.worker.js');
      if (!crawlWorker.isRunning) crawlWorker.start();
    }
  } catch (e) {
    logger.error(TAG, `Failed to launch crawl worker: ${e.message}`);
  }

  logger.logExecution({ 
    executionId: `keywordResearchAgent:${projectId}:${Date.now()}`, 
    source: 'keywordResearchAgent', 
    agentKey: AGENT_KEY, 
    projectId, 
    status: 'started'
  });

  // 2. Synchronously fetch initial candidates so the UI can display them immediately
  const candidates = await collectKeywordCandidates(project, agencyId, options.seedKeyword);
  
  if (candidates.length > 0) {
    const suggestedKeywords = candidates.slice(0, MAX_SUGGESTIONS).map(c => ({
       keyword: c.keyword,
       opportunityScore: 75,
       rationale: 'Discovered instantly',
       theme: 'General',
       ...c
    }));
    
    // Save them to DB immediately as Suggested so they appear in the UI table
    const bulkOps = suggestedKeywords.map(k => ({
      updateOne: {
        filter: { projectId, keyword: k.keyword },
        update: {
          $set: { agencyId, source: 'discovery' },
          $setOnInsert: {
            status: 'Approved',
            lifecycle: 'Discovered',
            'metrics.searchVolume': k.searchVolume || 0,
            'metrics.cpc': k.cpc || 0,
            'metrics.keywordDifficulty': k.keywordDifficulty || 0,
            'metrics.competition': k.competition || 0,
            'metrics.intent': k.intent || 'unknown',
            isQuestion: false
          },
          $max: { 'agent.opportunityScore': k.opportunityScore || 50 }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await WorkspaceKeyword.bulkWrite(bulkOps);
    }
    
    return { 
      candidateCount: candidates.length, 
      suggestedKeywords, 
      summary: `Found ${candidates.length} keyword candidates immediately. A deeper crawl is also running in the background.` 
    };
  }

  return { candidateCount: 0, suggestedKeywords: [], summary: 'Keyword discovery crawl has been queued and is processing in the background. Keywords will appear shortly.' };
}

/**
 * @param {string} projectId
 * @param {string[]} keywordIds
 * @param {string} userId
 */
async function approveKeywords(projectId, keywordIds, userId) {
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw new Error('At least one keywordId is required');
  }

  const approvedDocs = await WorkspaceKeyword.find({ _id: { $in: keywordIds }, projectId, status: 'Suggested' }, 'keyword').lean();

  const result = await WorkspaceKeyword.updateMany(
    { _id: { $in: keywordIds }, projectId, status: 'Suggested' },
    { $set: { status: 'Approved', approvedBy: userId, approvedAt: new Date(), rejectionReason: null } }
  );

  auditLogService.record({
    targetType: 'Keyword', targetId: projectId, projectId,
    action: 'keywords_approved', fromValue: 'Suggested', toValue: `${result.modifiedCount} approved`, userId
  });

  const keywords = approvedDocs.map((d) => d.keyword);
  await recommendationMemory.markResponded(projectId, keywords, 'accepted', userId);
  keywords.forEach((keyword) => keywordEvents.emitSafe(EVENTS.KEYWORD_APPROVED, { projectId, keyword, userId }));

  return result;
}

async function rejectKeywords(projectId, keywordIds, userId, reason) {
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw new Error('At least one keywordId is required');
  }

  const rejectedDocs = await WorkspaceKeyword.find({ _id: { $in: keywordIds }, projectId, status: 'Suggested' }, 'keyword').lean();

  const result = await WorkspaceKeyword.updateMany(
    { _id: { $in: keywordIds }, projectId, status: 'Suggested' },
    { $set: { status: 'Rejected', rejectionReason: reason || null } }
  );

  auditLogService.record({
    targetType: 'Keyword', targetId: projectId, projectId,
    action: 'keywords_rejected', fromValue: 'Suggested', toValue: `${result.modifiedCount} rejected`, userId
  });

  const keywords = rejectedDocs.map((d) => d.keyword);
  await recommendationMemory.markResponded(projectId, keywords, 'rejected', userId, reason);
  keywords.forEach((keyword) => keywordEvents.emitSafe(EVENTS.KEYWORD_REJECTED, { projectId, keyword, userId, reason }));

  await recordExcludedThemesIfRepeated(projectId, keywordIds, userId);

  return result;
}

async function recordExcludedThemesIfRepeated(projectId, keywordIds, userId) {
  try {
    const rejected = await WorkspaceKeyword.find({ _id: { $in: keywordIds }, projectId }).lean();
    const themes = [...new Set(rejected.map((k) => k.agent?.theme).filter(Boolean))];
    if (themes.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const theme of themes.slice(0, 3)) {
      const priorRejectionCount = await WorkspaceKeyword.countDocuments({
        projectId, 'agent.theme': theme, status: 'Rejected'
      });

      if (priorRejectionCount >= 2) {
        await sharedMemory.remember({
          agencyId,
          projectId,
          title: `Excluded keyword theme: ${theme}`,
          description: `Keywords themed "${theme}" have been rejected ${priorRejectionCount} times for this project.`,
          content: `Avoid suggesting further keywords in the "${theme}" theme unless explicitly requested.`,
          type: 'excluded_keyword_theme'
        });
      }
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-theme memory for project ${projectId}: ${error.message}`, { projectId });
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
    $or: [{ agentKey: AGENT_KEY }, { source: 'keywordResearchAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectKeywordCandidates,
  analyzeAndSuggest,
  approveKeywords,
  rejectKeywords,
  getExecutionHistory
};