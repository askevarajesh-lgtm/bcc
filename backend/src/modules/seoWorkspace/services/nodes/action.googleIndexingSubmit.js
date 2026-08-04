const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_google_indexing_submit',
  name: 'Submit to Google Indexing API',
  category: 'SEO',
  icon: 'UploadCloud',
  description: 'Submits URL to Google Indexing API for rapid indexing or removal (URL_UPDATED or URL_DELETED)',

  documentation: {
    overview: 'Submits specific URLs to Google Indexing API using OAuth credentials stored in SecretVault.',
    inputsDoc: [
      { name: 'url', desc: 'URL to submit for indexing/removal', type: 'string', required: true },
      { name: 'type', desc: 'Notification type (URL_UPDATED or URL_DELETED)', type: 'string', default: 'URL_UPDATED' },
      { name: 'credentialName', desc: 'Name of credential stored in SecretVault', type: 'string', default: 'google_indexing' }
    ],
    outputsDoc: [
      { name: 'submitted', desc: 'Whether URL was successfully sent', type: 'boolean' },
      { name: 'urlNotificationTime', desc: 'Time of update from Google', type: 'string' },
      { name: 'statusCode', desc: 'HTTP response status code', type: 'number' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 3000,
  estimatedCost: { apiCalls: 1, aiTokens: 0, thirdPartyCalls: 1 },
  dependencies: [],
  permissions: ['seo:indexing:submit'],

  getInputSchema() {
    return [
      { name: 'url', label: 'URL to Submit', type: 'text', placeholder: 'https://askeva.io/blog/seo-automation', required: true },
      { name: 'type', label: 'Action Type', type: 'select', defaultValue: 'URL_UPDATED', options: [
        { label: 'Update or Index URL (URL_UPDATED)', value: 'URL_UPDATED' },
        { label: 'Remove URL from Index (URL_DELETED)', value: 'URL_DELETED' }
      ]},
      { name: 'credentialName', label: 'SecretVault Credential Name', type: 'text', defaultValue: 'google_indexing' }
    ];
  },

  getOutputSchema() {
    return {
      submitted: { type: 'boolean', description: 'Google submission success status' },
      urlNotificationTime: { type: 'string', description: 'Submission timestamp' },
      statusCode: { type: 'number', description: 'HTTP response code' }
    };
  },

  validate: (config) => Boolean(config && config.url),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        submitted: true,
        urlNotificationTime: new Date().toISOString(),
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

      const notifyTime = res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date();

      return {
        success: true,
        submitted: true,
        urlNotificationTime: new Date(notifyTime).toISOString(),
        statusCode: res.status
      };
    } catch (err) {
      logger.warn('Action:GoogleIndexingSubmit', `Submission failed: ${err.message}`);
      return {
        success: false,
        submitted: false,
        statusCode: err.response?.status || 500,
        error: err.message
      };
    }
  }
};
