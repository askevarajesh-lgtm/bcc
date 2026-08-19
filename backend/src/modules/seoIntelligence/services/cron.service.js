const cron = require('node-cron');
const SeoProject = require('../models/seoProject.model');
const SeoKeyword = require('../models/seoKeyword.model');

class CronService {
  constructor() {
    this.jobs = [];
  }

  start() {
    // Run daily at midnight: 0 0 * * *
    // For demo purposes, we'll run it every hour: 0 * * * *
    const dailyJob = cron.schedule('0 * * * *', async () => {
      console.log('[CronService] Running Autopilot Checks...');
      try {
        const autopilotProjects = await SeoProject.find({ 'settings.autopilot': true });
        
        for (const project of autopilotProjects) {
          console.log(`[CronService] Checking rank drops for project: ${project.name}`);
          // Simulate rank tracking check
          const keywords = await SeoKeyword.find({ projectId: project._id });
          
          for (const kw of keywords) {
            // Actual rank tracking would happen via Semrush API here
            // Removing fake rank drop simulation
          }
        }
      } catch (error) {
        console.error('[CronService] Error in daily job:', error);
      }
    });

    this.jobs.push(dailyJob);
    console.log('[CronService] Autopilot jobs scheduled.');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
  }
}

module.exports = new CronService();
