const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_jira_create_issue',
  
  metadata: () => ({
    id: 'action_jira_create_issue',
    name: 'Jira Create Issue',
    description: 'Creates a bug or task in Atlassian Jira with project key, summary, description, and issue type',
    category: 'integrations',
    icon: 'trello',
    inputs: ['host', 'projectKey', 'summary', 'description', 'issueType', 'credentialName'],
    outputs: ['issueKey', 'issueId', 'selfUrl']
  }),

  validate: (config) => Boolean(config && config.summary && config.projectKey),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        issueKey: `${config.projectKey || 'SEO'}-101`,
        issueId: '10001',
        selfUrl: `https://${config.host || 'yourdomain.atlassian.net'}/browse/${config.projectKey || 'SEO'}-101`
      };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'jira');
      const host = config.host || creds.host;
      const email = creds.email || creds.username;
      const apiToken = creds.apiToken || creds.apiKey;

      const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');

      const res = await axios.post(`https://${host}/rest/api/3/issue`, {
        fields: {
          project: { key: config.projectKey },
          summary: config.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{ text: config.description || 'Created by SEO Automation', type: 'text' }]
            }]
          },
          issuetype: { name: config.issueType || 'Task' }
        }
      }, {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        timeout: 12000
      });

      return {
        success: true,
        issueKey: res.data.key,
        issueId: res.data.id,
        selfUrl: res.data.self
      };
    } catch (err) {
      logger.error('Action:Jira', `Jira issue creation failed: ${err.message}`);
      throw new Error(`Jira issue creation failed: ${err.message}`);
    }
  }
};
