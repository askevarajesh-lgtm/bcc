const cron = require('node-cron');
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceAudit = require('../models/workspaceAudit.model');
const WorkspaceReport = require('../models/workspaceReport.model');
const WorkspaceAgentOrchestrator = require('./workspaceAgentOrchestrator.service');
const auditLogService = require('./auditLog.service');
const DataForSeoService = require('../../seoIntelligence/dataForSeo.service');
const sendpulseService = require('../../../utils/sendpulse.service');

const FREQUENCY_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000
};

class WorkspaceCronService {
  constructor() {
    this.jobs = [];
    this.orchestrator = new WorkspaceAgentOrchestrator();
  }

  start() {
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
                await this.orchestrator.seoMonitorAgent(project, kw, drop);
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

    const reportSchedulerJob = cron.schedule('15 * * * *', async () => {
      console.log('[WorkspaceCronService] Checking scheduled reports...');
      await this.runDueScheduledReports();
    });

    this.jobs.push(reportSchedulerJob);
    console.log('[WorkspaceCronService] Autopilot + scheduled-report jobs scheduled.');
  }

  async runDueScheduledReports() {
    try {
      const scheduledReports = await WorkspaceReport.find({ isScheduled: true, scheduleFrequency: { $ne: null } });
      const now = new Date();

      for (const scheduleDef of scheduledReports) {
        const intervalMs = FREQUENCY_MS[scheduleDef.scheduleFrequency];
        if (!intervalMs) continue;

        const lastRun = scheduleDef.lastRunAt || scheduleDef.createdAt;
        const due = (now.getTime() - new Date(lastRun).getTime()) >= intervalMs;
        if (!due) continue;

        if (!scheduleDef.projectId) {
          // Nothing to diff against without a project; skip rather than crash the loop.
          continue;
        }

        try {
          const audits = await WorkspaceAudit.find({ projectId: scheduleDef.projectId }).sort({ createdAt: -1 }).limit(2);
          if (audits.length < 2) {
            console.warn(`[WorkspaceCronService] Skipping scheduled report ${scheduleDef._id}: fewer than 2 audits available.`);
            continue;
          }

          const latest = audits[0].metrics;
          const previous = audits[1].metrics;
          const auditDiff = {
            diff: {
              performance: latest.performance - previous.performance,
              onPage: latest.onPage - previous.onPage,
              crawlability: latest.crawlability - previous.crawlability,
              overall: latest.overall - previous.overall
            }
          };

          // The freshly generated instance is a one-off delivery, not itself
          // a new recurring schedule — only scheduleDef keeps recurring.
          const newReport = await this.orchestrator.seoReporterAgent(scheduleDef.projectId, auditDiff, {});

          const project = await WorkspaceProject.findById(scheduleDef.projectId);
          for (const recipient of scheduleDef.emailRecipients || []) {
            try {
              await sendpulseService.sendEmail(
                recipient,
                `Scheduled SEO Report: ${project?.name || 'Your Project'}`,
                `<p>Your ${scheduleDef.scheduleFrequency} SEO report is ready.</p>
                 <div>${newReport.content ? newReport.content.replace(/\n/g, '<br/>') : ''}</div>`
              );
            } catch (emailErr) {
              console.error(`[WorkspaceCronService] Failed to email scheduled report to ${recipient}:`, emailErr.message);
            }
          }

          scheduleDef.lastRunAt = now;
          await scheduleDef.save();

          auditLogService.record({
            targetType: 'Report', targetId: scheduleDef._id, projectId: scheduleDef.projectId,
            action: 'scheduled_run', fromValue: lastRun, toValue: now, userId: scheduleDef.createdBy
          });
        } catch (perReportErr) {
          console.error(`[WorkspaceCronService] Error running scheduled report ${scheduleDef._id}:`, perReportErr.message);
        }
      }
    } catch (error) {
      console.error('[WorkspaceCronService] Error checking scheduled reports:', error);
    }
  }

  stop() {
    this.jobs.forEach(job => job.stop());
  }
}

module.exports = new WorkspaceCronService();

module.exports.FREQUENCY_MS = FREQUENCY_MS;