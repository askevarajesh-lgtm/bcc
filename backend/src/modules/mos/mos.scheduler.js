const cron = require('node-cron');
const User = require('../auth/user.model');
const mosService = require('./mos.service');

const startMosScheduler = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('[MOS] Starting scheduled calculation...');
      
      // Get all unique agency IDs
      const agencies = await User.find({
        role: { $in: ['agency_super_admin', 'agency_manager'] },
        status: 'active'
      }).distinct('agencyId');

      for (const agencyId of agencies) {
        if (agencyId) {
          await mosService.calculateAgencyMOS(agencyId);
        }
      }
      
      console.log('[MOS] Scheduled calculation completed successfully.');
    } catch (error) {
      console.error('[MOS] Scheduled calculation failed:', error);
    }
  });
};

module.exports = startMosScheduler;
