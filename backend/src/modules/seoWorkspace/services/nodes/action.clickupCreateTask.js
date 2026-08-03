const axios = require('axios');
const secretVault = require('../secretVault.service');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_clickup_create_task',
  
  metadata: () => ({
    id: 'action_clickup_create_task',
    name: 'ClickUp Create Task',
    description: 'Creates a task in ClickUp with list ID, name, description, priority, and assignees',
    category: 'integrations',
    icon: 'check-square',
    inputs: ['listId', 'name', 'description', 'priority', 'credentialName'],
    outputs: ['taskId', 'taskUrl']
  }),

  validate: (config) => Boolean(config && config.name && config.listId),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        taskId: 'cu_task_' + Date.now(),
        taskUrl: 'https://app.clickup.com/t/sim123'
      };
    }

    try {
      const creds = await secretVault.getDecryptedCredential(context.projectId, config.credentialName || 'clickup');
      const apiToken = creds.apiToken || creds.apiKey || creds.token;

      const res = await axios.post(`https://api.clickup.com/api/v2/list/${config.listId}/task`, {
        name: config.name,
        description: config.description || '',
        priority: config.priority ? Number(config.priority) : 3
      }, {
        headers: { Authorization: apiToken, 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return {
        success: true,
        taskId: res.data.id,
        taskUrl: res.data.url
      };
    } catch (err) {
      throw new Error(`ClickUp task creation failed: ${err.message}`);
    }
  }
};
