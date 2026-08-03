const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_http_request',
  
  metadata: () => ({
    id: 'action_http_request',
    name: 'HTTP / REST Webhook Request',
    description: 'Sends an HTTP request to any external API with custom headers, body, authentication, and timeout',
    category: 'actions',
    icon: 'globe',
    inputs: ['url', 'method', 'headers', 'body', 'credentialName', 'timeoutMs'],
    outputs: ['statusCode', 'data', 'headers', 'durationMs', 'isSuccess']
  }),

  validate: (config) => Boolean(config && config.url),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        statusCode: 200,
        data: { message: 'Simulated HTTP 200 OK response' },
        headers: { 'content-type': 'application/json' },
        durationMs: 45,
        isSuccess: true
      };
    }

    const method = (config.method || 'POST').toUpperCase();
    const headers = { ...(config.headers || {}) };

    // If credentialName is specified, resolve from SecretVault
    if (config.credentialName) {
      try {
        const cred = await secretVault.getDecryptedCredential(context.projectId, config.credentialName);
        if (cred.apiKey) headers['Authorization'] = `Bearer ${cred.apiKey}`;
        if (cred.accessToken) headers['Authorization'] = `Bearer ${cred.accessToken}`;
        if (cred.token) headers['Authorization'] = `token ${cred.token}`;
        if (cred.headers) Object.assign(headers, cred.headers);
      } catch (e) {
        logger.warn('Action:HttpRequest', `Could not attach credential '${config.credentialName}': ${e.message}`);
      }
    }

    const startedAt = Date.now();
    try {
      const response = await axios({
        url: config.url,
        method,
        headers,
        data: config.body,
        timeout: Number(config.timeoutMs) || 15000,
        validateStatus: () => true // Do not throw on 4xx/5xx so user can handle via condition
      });

      const durationMs = Date.now() - startedAt;
      const isSuccess = response.status >= 200 && response.status < 300;

      return {
        success: isSuccess,
        statusCode: response.status,
        data: response.data,
        headers: response.headers,
        durationMs,
        isSuccess
      };
    } catch (err) {
      throw new Error(`HTTP Request failed to ${config.url}: ${err.message}`);
    }
  }
};
