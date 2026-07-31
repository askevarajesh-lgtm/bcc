const cron = require('node-cron');
const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const WorkspaceAudit = require('../models/workspaceAudit.model');
const WorkspaceReport = require('../models/workspaceReport.model');
const WorkspaceAgentOrchestrator = require('./workspaceAgentOrchestrator.service');
const auditLogService = require('./auditLog.service');
const keywordProviderChain = require('../../seoWorkspace/providers/keywordProviderChain');
const logger = require('../../aiCore/logger.service');
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
      logger.info('WorkspaceCronService', 'Running Autopilot Checks...');
      try {
        const autopilotProjects = await WorkspaceProject.find({ 'settings.autopilot': true, isDeleted: false });
        
        for (const project of autopilotProjects) {
          logger.info('WorkspaceCronService', `Checking rank drops for project: ${project.name}`);
          const keywords = await WorkspaceKeyword.find({ projectId: project._id, isDeleted: false });
          
          if (keywords.length === 0) continue;

          logger.info('WorkspaceCronService', `[REQUEST_PREP] Preparing SERP tasks for ${keywords.length} keywords`);
          const tasks = keywords.map(kw => ({
            keyword: kw.keyword,
            location_code: kw.locationCode || 2840,
            language_code: kw.languageCode || 'en'
          }));

          logger.info('WorkspaceCronService', `[PROVIDER_FETCH] Calling keywordProviderChain.getSerpResults`);
          const res = await keywordProviderChain.getSerpResults(tasks);
          const realSerpData = res.data || [];
          
          let pipelineStatus = 'UNKNOWN';
          if (res.status === 'TIMEOUT') pipelineStatus = 'TIMEOUT';
          else if (res.status === 'RATE_LIMIT') pipelineStatus = 'RATE_LIMIT';
          else if (res.status === 'PROVIDER_ERROR') pipelineStatus = 'PROVIDER_ERROR';
          else if (res.status === 'SUCCESS' && realSerpData.length > 0) pipelineStatus = 'SUCCESS';
          else pipelineStatus = 'NOT_FOUND_TOP100'; // Default to NOT_FOUND if empty but successful

          for (const [index, kw] of keywords.entries()) {
            const previousRank = kw.ranking?.currentRank;
            let currentRank = null;
            let currentStatus = 'UNKNOWN';

            if (pipelineStatus === 'SUCCESS') {
              const taskResult = realSerpData[index] || {};
              const topResults = taskResult.topResults || [];
              const projectDomain = project.domain.replace(/^https?:\/\/(www\.)?/, '');
              const foundItem = topResults.find(item => item.domain && item.domain.includes(projectDomain));
              
              if (foundItem) {
                currentRank = foundItem.rank;
                currentStatus = 'FOUND';
                logger.info('WorkspaceCronService', `[RANK_EXTRACTION] Keyword "${kw.keyword}" found at rank ${currentRank}`);
              } else {
                currentStatus = 'NOT_FOUND_TOP100';
                logger.info('WorkspaceCronService', `[RANK_EXTRACTION] Keyword "${kw.keyword}" not found in top results.`);
              }
            } else {
              currentStatus = pipelineStatus;
              logger.warn('WorkspaceCronService', `[RANK_EXTRACTION] Keyword "${kw.keyword}" rank unavailable due to ${currentStatus}`);
            }

            kw.ranking = kw.ranking || {};
            kw.ranking.previousRank = previousRank;
            kw.ranking.currentRank = currentRank;
            kw.ranking.status = currentStatus;
            
            if (currentRank && (!kw.ranking.bestRank || currentRank < kw.ranking.bestRank)) {
                kw.ranking.bestRank = currentRank;
            }

            kw.ranking.history = kw.ranking.history || [];
            kw.ranking.history.push({
              date: new Date(),
              rank: currentRank
            });

            logger.info('WorkspaceCronService', `[DB_SAVE] Saving rank for "${kw.keyword}" (Rank: ${currentRank}, Status: ${currentStatus})`);
            await kw.save();
            
            // Recovery task logic
            // Rule: ONLY trigger on organic drops or transition from FOUND to NOT_FOUND_TOP100
            // DO NOT trigger on infrastructure errors (TIMEOUT, RATE_LIMIT, PROVIDER_ERROR)
            let isOrganicDrop = false;
            let isNewlyLost = false;

            if (currentStatus === 'FOUND' && previousRank !== null && currentRank !== null) {
              const drop = currentRank - previousRank;
              if (drop >= 2) isOrganicDrop = true;
            }

            if (currentStatus === 'NOT_FOUND_TOP100' && previousRank !== null) {
              isNewlyLost = true;
            }

            if (isOrganicDrop || isNewlyLost) {
              const dropMsg = isNewlyLost ? 'Dropped out of Top 100' : `Dropped from ${previousRank} to ${currentRank}`;
              logger.info('WorkspaceCronService', `[ALERT] Generating recovery task for "${kw.keyword}": ${dropMsg}`);
              try {
                await this.orchestrator.seoMonitorAgent(project, kw, isNewlyLost ? 100 : (currentRank - previousRank));
              } catch (taskErr) {
                logger.error('WorkspaceCronService', `Error generating task for ${kw.keyword}: ${taskErr.message}`);
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

    const automationJob = cron.schedule('*/15 * * * *', async () => {
      console.log('[WorkspaceCronService] Checking automation rules...');
      await this.runDueAutomationRules();
    });

    this.jobs.push(automationJob);
    console.log('[WorkspaceCronService] Autopilot + scheduled-report + automation-rule jobs scheduled.');
  }

  async runDueAutomationRules() {
    const automationAgent = require('./automationAgent.service');
    try {
      const projectIds = await automationAgent.getEligibleProjectIds();

      for (const projectId of projectIds) {
        try {
          await automationAgent.run(projectId);
        } catch (err) {
          console.error(`[WorkspaceCronService] Automation run failed for project ${projectId}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[WorkspaceCronService] Error checking automation rules:', error);
    }
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