const cron = require('node-cron');
const benchmarkService = require('./benchmark.service');

// Schedule to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily benchmark aggregation job...');
    try {
        await benchmarkService.calculateAndAggregateBenchmarks();
    } catch (error) {
        console.error('Error in daily benchmark aggregation:', error);
    }
});
