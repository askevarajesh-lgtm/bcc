const axios = require('axios');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'send_slack',
  
  metadata: () => ({
    id: 'send_slack',
    name: 'Send Slack Message',
    description: 'Send a notification to a Slack channel via webhook',
    category: 'notification',
    icon: 'slack'
  }),

  validate: (config) => {
    // In a real scenario, the webhookUrl might come from Workspace Integrations instead of config
    if (!config || (!config.webhookUrl && !config.integrationId)) return false;
    if (!config.message) return false;
    return true;
  },

  execute: async (config, context) => {
    logger.info('Action:SendSlack', `Sending slack message for project ${context.projectId}`);
    
    const messagePayload = {
      text: config.message,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: config.message
          }
        }
      ]
    };

    // Replace this with the actual integration fetching logic based on integrationId if present
    const url = config.webhookUrl; 

    if (!url) {
      throw new Error('Slack webhook URL missing');
    }

    try {
      if (!context.isSimulation) {
        await axios.post(url, messagePayload);
      }
      return { success: true, delivered: true, text: config.message };
    } catch (err) {
      throw new Error(`Slack API error: ${err.message}`);
    }
  },

  simulate: async (config, context) => {
    return { 
      success: true, 
      simulated: true, 
      message: `Would send Slack message: ${config.message}` 
    };
  }
};
