const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_gsc_inspect_url',
  
  metadata: () => ({
    id: 'action_gsc_inspect_url',
    name: 'GSC URL Inspection',
    description: 'Queries Google Search Console URL Inspection API for live indexing state, mobile friendliness, and canonicals',
    category: 'seo',
    icon: 'search',
    inputs: ['inspectionUrl', 'siteUrl', 'credentialName'],
    outputs: ['indexingState', 'verdict', 'canonicalMatch', 'crawledAs', 'lastCrawlTime']
  }),

  validate: (config) => Boolean(config && config.inspectionUrl),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        indexingState: 'INDEXED',
        verdict: 'PASS',
        canonicalMatch: true,
        crawledAs: 'Googlebot Smartphone',
        lastCrawlTime: new Date()
      };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'google_search_console');
      const token = creds.accessToken || creds.apiKey;
      
      const res = await axios.post('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        inspectionUrl: config.inspectionUrl,
        siteUrl: config.siteUrl || context.siteUrl
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000
      });

      const inspectionResult = res.data?.inspectionResult?.indexStatusResult || {};
      return {
        success: true,
        indexingState: inspectionResult.coverageState || 'UNKNOWN',
        verdict: inspectionResult.verdict || 'NEUTRAL',
        canonicalMatch: inspectionResult.userCanonical === inspectionResult.googleCanonical,
        crawledAs: inspectionResult.crawledAs || 'Googlebot',
        lastCrawlTime: inspectionResult.lastCrawlTime || new Date()
      };
    } catch (err) {
      logger.warn('Action:GscInspectUrl', `Inspection API failed: ${err.message}`);
      return {
        success: false,
        error: err.message,
        indexingState: 'ERROR'
      };
    }
  }
};
