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

          const rankTrackingService = require('./rankTracking.service');
          await rankTrackingService.trackKeywords(project, keywords);
          
          // Re-fetch keywords to check if we need recovery tasks based on the updated ranks
          const updatedKeywords = await WorkspaceKeyword.find({ projectId: project._id, isDeleted: false });
          for (const kw of updatedKeywords) {
            let isOrganicDrop = false;
            let isNewlyLost = false;

            if (kw.ranking.trend === 'Declined' && kw.ranking.rankChange && kw.ranking.rankChange < -1) {
              isOrganicDrop = true;
            }
            if (kw.ranking.trend === 'Lost Visibility') {
              isNewlyLost = true;
            }

            if (isOrganicDrop || isNewlyLost) {
              const dropMsg = isNewlyLost ? 'Dropped out of Top 100' : `Dropped from ${kw.ranking.previousRank} to ${kw.ranking.currentRank}`;
              logger.info('WorkspaceCronService', `[ALERT] Generating recovery task for "${kw.keyword}": ${dropMsg}`);
              try {
                const dropAmount = isNewlyLost ? 100 : Math.abs(kw.ranking.rankChange);
                await this.orchestrator.seoMonitorAgent(project, kw, dropAmount);
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