const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceAeoAudit = require('../models/workspaceAeoAudit.model');
const WorkspaceAeoAuditPage = require('../models/workspaceAeoAuditPage.model');
const WorkspaceAeoAuditSimulation = require('../models/workspaceAeoAuditSimulation.model');
const WorkspaceAeoAuditEntityGraph = require('../models/workspaceAeoAuditEntityGraph.model');
const WorkspaceAeoAuditRecommendation = require('../models/workspaceAeoAuditRecommendation.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const SchemaValidatorService = require('./schemaValidator.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'aeo-agent';
const TAG = 'AeoAgent';
const AEO_CRAWL_PAGE_LIMIT = 20;

async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  // Create audit in queued state
  const audit = await WorkspaceAeoAudit.create({
    projectId: project._id,
    agencyId,
    status: 'queued'
  });

  // Dispatch background job (does not block HTTP response)
  executionQueue.run(`aeo-audit:${audit._id}`, async () => {
    await processAeoAudit(audit._id, project, agencyId);
  }).catch(e => logger.error(TAG, `Queue dispatch failed: ${e.message}`, { auditId: audit._id }));

  return audit;
}

async function processAeoAudit(auditId, project, workspaceId) {
  const executionId = `aeoAudit:${auditId}:${Date.now()}`;
  const startedAt = Date.now();

  try {
    await WorkspaceAeoAudit.findByIdAndUpdate(auditId, { status: 'running' });
    logger.logExecution({ executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId: project._id, status: 'started' });

    const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;
    const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, AEO_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
      .catch((error) => {
        logger.warn(TAG, `Crawl failed for ${rootUrl}: ${error.message}`);
        return { pages: [] };
      });

    const uniquePagesMap = new Map();
    crawlResult.pages.filter(p => p.status === 200 && p.indexable).forEach(p => {
      const url = p.final_url || p.url;
      if (!uniquePagesMap.has(url)) {
        uniquePagesMap.set(url, p);
      }
    });
    const indexablePages = Array.from(uniquePagesMap.values());
    
    // Create page records
    const pageRecords = await Promise.all(indexablePages.map(async p => {
      // Programmatic schema validation first
      const schemaValidation = SchemaValidatorService.validate(p.jsonLd);
      
      return WorkspaceAeoAuditPage.create({
        auditId,
        projectId: project._id,
        pageUrl: p.final_url || p.url,
        status: 'queued',
        schemaValidation
      });
    }));

    // Process pages with concurrency limit (e.g., 3 pages at a time) to respect rate limits
    const CONCURRENCY = 3;
    let failedPages = 0;
    let completedPages = 0;
    const totalPages = pageRecords.length;
    
    const processQueue = [...pageRecords.map((record, index) => ({ record, crawlData: indexablePages[index] }))];
    
    const worker = async () => {
      while (processQueue.length > 0) {
        const item = processQueue.shift();
        try {
          await processAeoPage(item.record, item.crawlData, project, workspaceId);
        } catch (err) {
          failedPages++;
          await WorkspaceAeoAuditPage.findByIdAndUpdate(item.record._id, { status: 'failed', error: err.message });
          logger.error(TAG, `Page analysis failed for ${item.record.pageUrl}: ${err.message}`, { auditId });
        }
        completedPages++;
        const progress = Math.round((completedPages / (totalPages || 1)) * 100);
        await WorkspaceAeoAudit.findByIdAndUpdate(auditId, { progress });
      }
    };

    const workers = Array(CONCURRENCY).fill(null).map(() => worker());
    await Promise.all(workers);

    // Final Summarization
    const finalAudit = await generateSummary(auditId, project, workspaceId, startedAt);
    finalAudit.status = failedPages > 0 ? 'completed_with_warnings' : 'completed';
    await finalAudit.save();

    logger.logExecution({ executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId: project._id, status: 'succeeded' });

  } catch (error) {
    logger.logExecution({ executionId, source: 'aeoAgent', agentKey: AGENT_KEY, projectId: project._id, status: 'failed', error: error.message });
    await WorkspaceAeoAudit.findByIdAndUpdate(auditId, { status: 'failed' });
  }
}

async function processAeoPage(pageRecord, crawlData, project, workspaceId) {
  await WorkspaceAeoAuditPage.findByIdAndUpdate(pageRecord._id, { status: 'running' });
  
  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });

  // 1. Page Analysis & Entity & Simulation Prompt
  const analysisPrompt = `You are the AEO Agent for ${project.name}. Analyze this page's readiness for Answer Engines.
Page URL: ${crawlData.final_url}
Title: ${crawlData.title}
H1: ${crawlData.h1}
Word Count: ${crawlData.word_count}
Schema Validation Issues: ${JSON.stringify(pageRecord.schemaValidation.issues)}
Headings: ${JSON.stringify(crawlData.headings)}

${memoryBlock}

Output strictly valid JSON with this exact schema:
{
  "readinessScore": 0-100,
  "contentQuality": 0-100,
  "readability": 0-100,
  "entities": {
    "nodes": [ { "id": "entity_name", "label": "Display Name", "type": "Organization|Person|Product|Service|Brand|Location|Technology|Event|Topic", "confidence": 0-100 } ],
    "edges": [ { "source": "id1", "target": "id2", "relationship": "string", "confidence": 0-100 } ]
  },
  "simulations": [
    {
      "platform": "ChatGPT" | "Google AI Overviews" | "Gemini" | "Perplexity" | "Copilot",
      "citationLikelihood": 0-100,
      "confidenceScore": 0-100,
      "bestCandidateParagraph": "string",
      "missingInformation": ["string"],
      "reasons": ["string"],
      "suggestedImprovements": ["string"]
    }
  ]
}`;

  const analysisRaw = await aiEngine.complete({
    workspaceId, agentKey: AGENT_KEY, projectId: project._id,
    messages: [{ role: 'user', content: analysisPrompt }],
    model: agentConfig.modelName, temperature: 0.2, maxTokens: 4000, jsonMode: true,
    retryOptions: { retries: 2, factor: 2 } // Exponential backoff is handled by retryOptions
  });

  const analysisResult = JSON.parse(analysisRaw);

  // Save Page Scores
  await WorkspaceAeoAuditPage.findByIdAndUpdate(pageRecord._id, {
    'pageScores.readinessScore': analysisResult.readinessScore,
    'pageScores.contentQuality': analysisResult.contentQuality,
    'pageScores.readability': analysisResult.readability
  });

  // Save Entities
  if (analysisResult.entities?.nodes?.length) {
    await WorkspaceAeoAuditEntityGraph.create({
      auditId: pageRecord.auditId,
      projectId: project._id,
      pageUrl: pageRecord.pageUrl,
      nodes: analysisResult.entities.nodes,
      edges: analysisResult.entities.edges || []
    });
  }

  // Save Simulations
  if (analysisResult.simulations?.length) {
    for (const sim of analysisResult.simulations) {
      await WorkspaceAeoAuditSimulation.create({
        auditId: pageRecord.auditId,
        pageUrl: pageRecord.pageUrl,
        platform: sim.platform,
        citationLikelihood: sim.citationLikelihood,
        confidenceScore: sim.confidenceScore,
        simulation: {
          bestCandidateParagraph: sim.bestCandidateParagraph,
          missingInformation: sim.missingInformation || [],
          reasons: sim.reasons || [],
          suggestedImprovements: sim.suggestedImprovements || []
        }
      });
    }
  }

  // 2. Recommendations Prompt
  const recPrompt = `Based on the AEO analysis for ${crawlData.final_url}, provide actionable recommendations.
Readiness Score: ${analysisResult.readinessScore}
Schema Issues: ${JSON.stringify(pageRecord.schemaValidation.issues)}

Output strictly valid JSON:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "category": "Technical" | "Content" | "Schema" | "Metadata" | "Internal Linking" | "Entities" | "EEAT",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "impact": "High" | "Medium" | "Low",
      "difficulty": "Hard" | "Medium" | "Easy",
      "estimatedEffort": "e.g., 2 hours",
      "suggestedFix": "Detailed fix instructions"
    }
  ]
}`;

  const recRaw = await aiEngine.complete({
    workspaceId, agentKey: AGENT_KEY, projectId: project._id,
    messages: [{ role: 'user', content: recPrompt }],
    model: agentConfig.modelName, temperature: 0.2, maxTokens: 2500, jsonMode: true,
    retryOptions: { retries: 2, factor: 2 }
  });

  const recResult = JSON.parse(recRaw);
  if (recResult.recommendations?.length) {
    const recsToInsert = recResult.recommendations.map(r => ({
      auditId: pageRecord.auditId,
      projectId: project._id,
      pageUrl: pageRecord.pageUrl,
      ...r
    }));
    await WorkspaceAeoAuditRecommendation.insertMany(recsToInsert);
  }

  await WorkspaceAeoAuditPage.findByIdAndUpdate(pageRecord._id, { status: 'completed', completedAt: new Date() });
}

async function generateSummary(auditId, project, workspaceId, startedAt) {
  const pages = await WorkspaceAeoAuditPage.find({ auditId }).lean();
  const recs = await WorkspaceAeoAuditRecommendation.find({ auditId }).lean();
  const simulations = await WorkspaceAeoAuditSimulation.find({ auditId }).lean();

  const avgReadiness = pages.length ? Math.round(pages.reduce((sum, p) => sum + (p.pageScores?.readinessScore || 0), 0) / pages.length) : 0;
  
  // Calculate average platform scores
  const platforms = { chatgpt: 0, googleAiOverviews: 0, gemini: 0, perplexity: 0, copilot: 0 };
  const counts = { chatgpt: 0, googleAiOverviews: 0, gemini: 0, perplexity: 0, copilot: 0 };
  
  simulations.forEach(s => {
    const p = s.platform.toLowerCase().replace(/[^a-z]/g, '');
    if (platforms[p] !== undefined && s.citationLikelihood) {
      platforms[p] += s.citationLikelihood;
      counts[p]++;
    }
  });
  
  Object.keys(platforms).forEach(k => {
    platforms[k] = counts[k] > 0 ? Math.round(platforms[k] / counts[k]) : 0;
  });

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const sumPrompt = `You are the AEO Agent for ${project.name}. Summarize the entire audit.
Avg Readiness: ${avgReadiness}
Total Pages Analyzed: ${pages.length}
Total Recommendations: ${recs.length}

Output strictly valid JSON:
{
  "summary": "2-4 sentence executive summary of AEO readiness across the site.",
  "eeatScore": 0-100 (estimated overall EEAT signal strength based on presence of entities and schema),
  "citationScore": 0-100 (overall aggregate citation likelihood)
}`;

  let summaryData = { summary: 'Audit completed.', eeatScore: 0, citationScore: 0 };
  try {
    const sumRaw = await aiEngine.complete({
      workspaceId, agentKey: AGENT_KEY, projectId: project._id,
      messages: [{ role: 'user', content: sumPrompt }],
      model: agentConfig.modelName, temperature: 0.3, maxTokens: 1000, jsonMode: true,
      retryOptions: { retries: 1 }
    });
    summaryData = JSON.parse(sumRaw);
  } catch (e) {
    logger.warn(TAG, `Summary generation failed: ${e.message}`);
  }

  const audit = await WorkspaceAeoAudit.findById(auditId);
  audit.summary = summaryData.summary;
  audit.overallScores = {
    aeo: avgReadiness,
    citation: summaryData.citationScore || 0,
    eeat: summaryData.eeatScore || 0,
    platforms
  };
  audit.completedAt = new Date();
  audit.executionTime = Date.now() - startedAt;
  
  return audit;
}

// ------------------------------------------
// Legacy Approval Workflow (mapped to tasks)
// ------------------------------------------
async function approveAeoRecommendations(auditId, projectId, userId, recommendationIds = []) {
  // If specific recommendations passed, approve those, otherwise approve pending.
  const query = { auditId, projectId, status: 'Pending' };
  if (recommendationIds.length > 0) {
    query._id = { $in: recommendationIds };
  }

  const recs = await WorkspaceAeoAuditRecommendation.find(query);
  const tasksToCreate = recs.map(r => ({
    projectId,
    pageUrl: r.pageUrl || project.domain,
    taskType: 'AEO Optimization',
    description: `[AEO - ${r.category}] ${r.title}\n\n${r.description}\n\nSuggested Fix:\n${r.suggestedFix}`,
    proposedChanges: { recommendationId: r._id },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    // Update recs with task IDs
    for (let i = 0; i < recs.length; i++) {
      recs[i].status = 'Task Created';
      recs[i].taskId = createdTasks[i]._id;
      await recs[i].save();
    }
  }

  auditLogService.record({
    targetType: 'AeoAudit', targetId: auditId, projectId,
    action: 'aeo_recommendations_approved', fromValue: 'Pending', toValue: 'Task Created', userId
  });

  return { approvedCount: recs.length, createdTasks };
}

async function rejectAeoRecommendations(auditId, projectId, userId, recommendationIds = [], reason) {
  const query = { auditId, projectId, status: 'Pending' };
  if (recommendationIds.length > 0) {
    query._id = { $in: recommendationIds };
  }
  
  await WorkspaceAeoAuditRecommendation.updateMany(query, { $set: { status: 'Ignored' } });

  auditLogService.record({
    targetType: 'AeoAudit', targetId: auditId, projectId,
    action: 'aeo_recommendations_ignored', fromValue: 'Pending', toValue: 'Ignored', userId
  });

  return { success: true };
}

async function getExecutionHistory(projectId, limit = 20) {
  return WorkspaceAeoAudit.find({ projectId }).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = {
  AGENT_KEY,
  run,
  processAeoAudit,
  approveAeoRecommendations,
  rejectAeoRecommendations,
  getExecutionHistory
};
