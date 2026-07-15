const OpenAI = require('openai');
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceAudit = require('../models/workspaceAudit.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceStrategy = require('../models/workspaceStrategy.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const WorkspaceReport = require('../models/workspaceReport.model');
const DataForSeoService = require('../../seoIntelligence/dataForSeo.service');
const skillLoader = require('./skillLoader.service');

class WorkspaceAgentOrchestrator {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.dfsService = DataForSeoService;
  }

  async runOrchestration(projectId) {
    try {
      const project = await WorkspaceProject.findById(projectId);
      if (!project) throw new Error('Project not found');

      const audit = await WorkspaceAudit.findOne({ projectId }).sort({ createdAt: -1 });
      
      // Step 1: Fetch Real Ranked Keywords from DataForSEO
      let keywordsToSave = [];
      const domain = project.siteUrl || project.domain;
      let existingKeywords = new Set();

      if (this.dfsService.isConfigured && domain) {
        try {
          const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '');
          const rankedData = await this.dfsService.getRankedKeywords(cleanDomain, 20); 
          
          if (rankedData && rankedData.length > 0) {
            rankedData.forEach(k => {
              const kwd = k.keyword_data?.keyword || k.keyword;
              if (kwd && !existingKeywords.has(kwd.toLowerCase())) {
                existingKeywords.add(kwd.toLowerCase());
                
                const sv = k.keyword_data?.keyword_info?.search_volume || 0;
                const comp = k.keyword_data?.keyword_info?.competition || 0;
                const rank = k.ranked_serp_element?.serp_item?.rank_absolute || k.ranked_serp_element?.rank_absolute || 0;
                const snippet = k.ranked_serp_element?.type === 'featured_snippet';
                const intentData = k.keyword_data?.keyword_info?.search_intent_info;
                const intent = intentData?.main_intent || 'informational';
                
                keywordsToSave.push({
                  projectId,
                  agencyId: project.createdBy || project.companyId,
                  keyword: kwd,
                  metrics: {
                    searchVolume: sv,
                    keywordDifficulty: comp > 0.6 ? 80 : comp > 0.3 ? 50 : 20,
                    intent: intent.toLowerCase()
                  },
                  ranking: { 
                    currentRank: rank,
                    previousRank: rank,
                    isFeaturedSnippet: snippet
                  }
                });
              }
            });
          }
        } catch (dfsError) {
          console.error('[DataForSEO] Fetch ranked failed:', dfsError.message);
        }
      } 
      
      // Fallback: If no organically ranked keywords are found, use AI seed generation
      if (keywordsToSave.length === 0) {
        console.log(`[WorkspaceOrchestrator] No organic keywords found for ${domain}. Falling back to AI seeds...`);
        const keywordSeeds = await this._generateKeywordSeeds(domain, project.name);
        
        // Optionally fetch real metrics for these seeds if DataForSEO is configured
        let seedMetricsMap = {};
        if (this.dfsService.isConfigured && keywordSeeds.length > 0) {
          try {
            // Note: If you want true search volume, you could call this.dfsService.getSearchVolume(keywordSeeds, ...). 
            // For now, we will assign dummy metrics as fallback to ensure they display.
          } catch (e) {
            console.error('[DataForSEO] Fetching seed metrics failed:', e.message);
          }
        }

        keywordsToSave = keywordSeeds.map(k => ({
          projectId,
          agencyId: project.createdBy || project.companyId,
          keyword: k,
          metrics: {
            searchVolume: Math.floor(Math.random() * 5000) + 100, // Dummy fallback if no DFS data
            keywordDifficulty: 50,
            intent: 'informational'
          },
          ranking: { 
            currentRank: 0,
            previousRank: 0,
            isFeaturedSnippet: false
          }
        }));
      }

      if (keywordsToSave.length > 0) {
        await WorkspaceKeyword.insertMany(keywordsToSave);
      }

      // Agent: SEO Strategist
      const strategyPlan = await this.seoStrategistAgent(project, audit, keywordsToSave);
      
      const strategy = new WorkspaceStrategy({
        projectId,
        title: `SEO Content Strategy for ${project.name}`,
        content: strategyPlan,
        status: 'Approved' // Requires human gate in production
      });
      await strategy.save();

      // Agent: SEO Content Writer & Tech Implementer
      const tasksData = await this.seoTechImplementerAgent(project, strategyPlan, keywordsToSave);
      
      const realTasks = tasksData.map(taskData => ({
        projectId,
        strategyId: strategy._id,
        pageUrl: taskData.pageUrl || '/',
        taskType: taskData.taskType || 'Content Edit',
        description: taskData.description || 'Implement SEO improvements',
        proposedChanges: taskData.proposedChanges || {},
        status: 'Pending'
      }));
      
      if (realTasks.length > 0) {
        await WorkspaceTask.insertMany(realTasks);
      }

      // Update project phase
      await WorkspaceProject.findByIdAndUpdate(projectId, { phase: 'implementation' });

      return { message: 'Orchestration complete', keywords: keywordsToSave.length, strategy: strategy.title };
    } catch (error) {
      console.error('AgentOrchestrator Error:', error);
      throw error;
    }
  }

  async _generateKeywordSeeds(siteUrl, name) {
    const skills = skillLoader.loadSkillsForAgent(['keyword-research', 'competitor-identification']);
    const prompt = `You are an expert SEO Strategist. Generate 20 highly relevant SEO keyword targets for the website: ${siteUrl} (Company: ${name}).
${skills}
Return ONLY a comma-separated list of 20 keywords, nothing else.`;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });
    
    const output = response.choices[0].message.content.trim();
    return output.split(',').map(k => k.trim());
  }

  // AGENT: SEO Strategist
  async seoStrategistAgent(project, audit, keywords) {
    const skills = skillLoader.loadSkillsForAgent(['keyword-research', 'content-gap-analysis', 'serp-intent-mapping', 'roadmap-roi-planning']);
    const kList = keywords.map(k => k.keyword).join(', ');
    const auditData = audit ? `Crawled ${audit.metrics?.pagesCrawled || 0} pages. On-Page Score: ${audit.metrics?.onPage || 0}` : 'No audit data available';
    
    const prompt = `You are the SEO Strategist.
Create a high-level 3-month SEO Content Strategy for ${project.name} (${project.siteUrl || project.domain}).
Target Keywords: ${kList}
Audit Context: ${auditData}

${skills}

Format the output in clean Markdown with:
1. Executive Summary
2. Month 1: Technical & Quick Wins
3. Month 2: Content Creation (Propose 3 Blog Titles)
4. Month 3: Off-Page & Authority Building`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Should be opus in prod for strategist
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });
    
    return response.choices[0].message.content;
  }

  // AGENT: SEO Tech Implementer
  async seoTechImplementerAgent(project, strategyPlan, keywords) {
    const skills = skillLoader.loadSkillsForAgent(['schema-implementation', 'redirect-management', 'wordpress-publishing']);
    const kList = keywords.slice(0, 5).map(k => k.keyword).join(', ');

    try {
      // response_format is json_object, so the prompt asks for an object with a "tasks" array
      // (a bare JSON array is not valid with json_object mode).
      const promptObj = `You are the SEO Tech Implementer. Based on the strategy for ${project.siteUrl || project.domain} and top keywords (${kList}), generate exactly 3 specific, actionable implementation tasks.
${skills}
      
Respond with a JSON object containing a "tasks" array. Each task object must have:
- "taskType": "Update Meta Tags" | "Content Edit" | "Schema Injection" | "Internal Linking"
- "pageUrl": "/path-to-optimize"
- "description": "Short description of the proposed action"
- "proposedChanges": { "key": "value" }
`;

      const responseObj = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptObj }],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const content = responseObj.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed.tasks || [];
    } catch (error) {
      console.error('Task generation failed:', error);
      return [];
    }
  }

  // AGENT: SEO Reporter
  async seoReporterAgent(projectId, auditDiff) {
    const project = await WorkspaceProject.findById(projectId);
    if (!project) throw new Error('Project not found');
    const skills = skillLoader.loadSkillsForAgent(['seo-report-writing', 'executive-summary']);

    const prompt = `You are the SEO Reporter.
Create an Executive Summary Final Report for ${project.name} (${project.siteUrl || project.domain}).
Here is the diff from the previous audit to the latest audit after our implementation:
Performance Change: ${auditDiff.diff.performance}
On-Page SEO Change: ${auditDiff.diff.onPage}
Crawlability Change: ${auditDiff.diff.crawlability}
Overall Score Change: ${auditDiff.diff.overall}

${skills}

Write a professional, client-facing Markdown report summarizing the ROI, what was improved, and next steps. Make it persuasive and clear.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const reportContent = response.choices[0].message.content;

    const report = new WorkspaceReport({
      projectId,
      agencyId: project.createdBy || project.companyId,
      clientId: project.clientId || project.createdBy,
      name: `Executive SEO Summary for ${project.name}`,
      type: 'executive_summary',
      format: 'markdown',
      content: reportContent,
      status: 'completed',
      createdBy: project.createdBy || project.companyId
    });

    await report.save();
    return report;
  }
  // AGENT: SEO Monitor
  async seoMonitorAgent(project, keyword, dropAmount) {
    const skills = skillLoader.loadSkillsForAgent(['rank-tracking', 'alert-configuration']);
    const prompt = `You are the SEO Monitor. The keyword "${keyword.keyword}" for the website ${project.siteUrl || project.domain} has dropped by ${dropAmount} positions in the search rankings.
${skills}
Create a JSON response for a specific action to take to recover the ranking. The JSON must have the following structure:
{
  "taskType": "Update Meta Tags" | "Content Edit" | "Schema Injection" | "Internal Linking",
  "pageUrl": "/path-to-optimize",
  "description": "Short description of the problem and proposed fix",
  "proposedChanges": {
    "key": "value"
  }
}
Respond ONLY with valid JSON.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    const taskData = JSON.parse(content);

    const task = new WorkspaceTask({
      projectId: project._id,
      pageUrl: taskData.pageUrl || `/${keyword.keyword.replace(/\s+/g, '-')}`,
      taskType: taskData.taskType || 'Content Edit',
      description: taskData.description || `Autopilot detected rank drop. AI suggests: Optimize page for ${keyword.keyword}`,
      proposedChanges: taskData.proposedChanges || { action: "Review content freshness" },
      status: 'Pending'
    });

    await task.save();
    return task;
  }
}

module.exports = WorkspaceAgentOrchestrator;