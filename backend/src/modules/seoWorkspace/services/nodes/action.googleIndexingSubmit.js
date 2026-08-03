const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_google_indexing_submit',
  
  metadata: () => ({
    id: 'action_google_indexing_submit',
    name: 'Submit to Google Indexing API',
    description: 'Submits URL to Google Indexing API for rapid indexing or removal (URL_UPDATED or URL_DELETED)',
    category: 'seo',
    icon: 'upload-cloud',
    inputs: ['url', 'type', 'credentialName'],
    outputs: ['submitted', 'urlNotificationTime', 'statusCode']
  }),

  validate: (config) => Boolean(config && config.url),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        submitted: true,
        urlNotificationTime: new Date(),
        statusCode: 200
      };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'google_indexing');
      const token = creds.accessToken;
      if (!token) throw new Error('No OAuth access token for Google Indexing API');

      const res = await axios.post('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        url: config.url,
        type: config.type || 'URL_UPDATED'
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      return {
        success: true,
        submitted: true,
        urlNotificationTime: res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date(),
        statusCode: res.status
      };
    } catch (err) {
      logger.warn('Action:GoogleIndexingSubmit', `Submission failed: ${err.message}`);
      return {
        success: false,
        submitted: false,
        error: err.message
      };
    }
  }
};
