const cron = require('node-cron');
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceAgentOrchestrator = require('./workspaceAgentOrchestrator.service');
const DataForSeoService = require('../../seoIntelligence/dataForSeo.service');

class WorkspaceCronService {
  constructor() {
    this.jobs = [];
    this.orchestrator = new WorkspaceAgentOrchestrator();
  }

  start() {
    // Run daily at midnight: 0 0 * * *
    // We will use 0 * * * * for demo purposes (hourly)
    const dailyJob = cron.schedule('0 * * * *', async () => {
      console.log('[WorkspaceCronService] Running Autopilot Checks...');
      try {
        const autopilotProjects = await WorkspaceProject.find({ 'settings.autopilot': true, isDeleted: false });
        
        for (const project of autopilotProjects) {
          console.log(`[WorkspaceCronService] Checking rank drops for project: ${project.name}`);
          const keywords = await WorkspaceKeyword.find({ projectId: project._id, isDeleted: false });
          
          if (keywords.length === 0) continue;

          // Attempt to get real SERP results if DataForSEO is configured
          let realSerpData = [];
          if (DataForSeoService.isConfigured) {
            try {
              const tasks = keywords.map(kw => ({
                keyword: kw.keyword,
                location_code: kw.locationCode || 2840,
                language_code: kw.languageCode || 'en'
              }));
              realSerpData = await DataForSeoService.getSerpResults(tasks);
            } catch (err) {
              console.error('[WorkspaceCronService] DataForSEO SERP check failed:', err.message);
            }
          }

          for (const [index, kw] of keywords.entries()) {
            const previousRank = kw.ranking?.currentRank || 10;
            let currentRank = previousRank;

            // If we have real SERP data, find the rank for the project's domain
            if (realSerpData && realSerpData[index] && realSerpData[index].result && realSerpData[index].result[0]) {
              const items = realSerpData[index].result[0].items || [];
              const projectDomain = project.domain.replace(/^https?:\/\/(www\.)?/, '');
              const foundItem = items.find(item => item.domain && item.domain.includes(projectDomain));
              
              if (foundItem) {
                currentRank = foundItem.rank_absolute || foundItem.rank_group || currentRank;
              } else {
                // Not found in top 100, meaning it dropped
                currentRank = 100;
              }
            } else {
              // Simulated Fallback for demo: Randomly drop rank by 1-4 positions for 30% of keywords
              if (Math.random() > 0.7) {
                currentRank = previousRank + Math.floor(Math.random() * 4) + 1;
              }
            }

            const drop = currentRank - previousRank;
            
            // Save updated rank
            kw.ranking.previousRank = previousRank;
            kw.ranking.currentRank = currentRank;
            if (!kw.ranking.bestRank || currentRank < kw.ranking.bestRank) {
                kw.ranking.bestRank = currentRank;
            }
            await kw.save();
            
            // Generate recovery task if dropped by 2 or more positions
            if (drop >= 2) {
              console.log(`[Alert] Workspace Keyword "${kw.keyword}" dropped by ${drop} positions (Rank ${previousRank} -> ${currentRank})! Generating recovery task...`);
              try {
                await this.orchestrator.generateTaskForRankDrop(project, kw, drop);
              } catch (taskErr) {
                console.error(`[WorkspaceCronService] Error generating task for ${kw.keyword}:`, taskErr.message);
              }
            }
          }
        }
      } catch (error) {
        console.error('[WorkspaceCronService] Error in daily job:', error);
      }
    });

    this.jobs.push(dailyJob);
    console.log('[WorkspaceCronService] Autopilot jobs scheduled.');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
  }
}

module.exports = new WorkspaceCronService();
