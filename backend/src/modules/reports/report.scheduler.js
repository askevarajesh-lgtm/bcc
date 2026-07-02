const cron = require('node-cron');
const reportService = require('./report.service');

const startReportScheduler = () => {
    // Schedule to run every hour to check for due reports
    cron.schedule('0 * * * *', async () => {
        console.log('Running report scheduler job...');
        try {
            await reportService.processDueSchedules();
        } catch (error) {
            console.error('Error in report scheduler:', error);
        }
    });
};

module.exports = startReportScheduler;
