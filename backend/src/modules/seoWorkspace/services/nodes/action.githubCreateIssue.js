const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_github_create_issue',
  
  metadata: () => ({
    id: 'action_github_create_issue',
    name: 'GitHub Create Issue',
    description: 'Creates a tracking issue in a GitHub repository with labels and assignees for SEO engineering tasks',
    category: 'integrations',
    icon: 'github',
    inputs: ['owner', 'repo', 'title', 'body', 'labels', 'credentialName'],
    outputs: ['issueNumber', 'htmlUrl', 'issueId']
  }),

  validate: (config) => Boolean(config && config.owner && config.repo && config.title),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        issueNumber: 42,
        htmlUrl: `https://github.com/${config.owner}/${config.repo}/issues/42`,
        issueId: 10042
      };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'github');
      const token = creds.token || creds.apiKey || creds.accessToken;

      const res = await axios.post(`https://api.github.com/repos/${config.owner}/${config.repo}/issues`, {
        title: config.title,
        body: config.body || '',
        labels: config.labels || ['seo', 'automation']
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'BCC-SEO-Workspace-Engine'
        },
        timeout: 10000
      });

      return {
        success: true,
        issueNumber: res.data.number,
        htmlUrl: res.data.html_url,
        issueId: res.data.id
      };
    } catch (err) {
      throw new Error(`GitHub issue creation failed: ${err.message}`);
    }
  }
};
