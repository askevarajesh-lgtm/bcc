const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_cloudflare_purge_cache',
  
  metadata: () => ({
    id: 'action_cloudflare_purge_cache',
    name: 'Cloudflare Purge Edge Cache',
    description: 'Purges Cloudflare CDN cache for specific URLs, tags, or entire zone after content updates',
    category: 'cloud',
    icon: 'refresh-cw',
    inputs: ['zoneId', 'files', 'purgeEverything', 'tags', 'credentialName'],
    outputs: ['isPurged', 'purgeResultId']
  }),

  validate: (config) => Boolean(config && config.zoneId),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return { success: true, isPurged: true, purgeResultId: 'sim_cf_purge_' + Date.now() };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'cloudflare');
      const token = creds.apiToken || creds.apiKey;
      if (!token) throw new Error('No Cloudflare API token found in credentials');

      const payload = config.purgeEverything ? { purge_everything: true } : { files: config.files || [] };

      const res = await axios.post(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: res.data && res.data.success,
        isPurged: true,
        purgeResultId: res.data?.result?.id || 'done'
      };
    } catch (err) {
      logger.error('Action:CloudflarePurge', `Cache purge failed: ${err.message}`);
      throw new Error(`Cloudflare cache purge failed: ${err.message}`);
    }
  }
};
