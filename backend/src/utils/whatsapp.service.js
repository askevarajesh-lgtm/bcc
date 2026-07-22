class WhatsAppService {
  async fetchTemplates(backendUrl, apiToken) {
    try {
      const axios = require('axios');
      // The templates endpoint is usually /v1/templates
      const templatesUrl = backendUrl.replace('message/send-message', 'templates').replace('{{token}}', apiToken);
      
      const response = await axios.get(templatesUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });
      return response.data?.data || response.data?.templates || response.data || [];
    } catch (error) {
      console.warn('[WhatsAppService] Failed to fetch real templates:', error.response?.data || error.message);
      return [];
    }
  }

  async sendMessage(backendUrl, apiToken, to, templateId, variables = {}, options = {}) {
    const axios = require('axios');
    const templateName = options.templateName || templateId;
    const languageCode = options.language || 'en';
    
    const parameters = Object.values(variables).map(val => ({ type: 'text', text: String(val) }));
    const components = parameters.length > 0 ? [{ type: 'body', parameters }] : [];

    const payload = {
      type: 'template',
      to: to.replace(/\D/g, ''),
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    };

    const finalUrl = backendUrl.replace('{{token}}', apiToken);

    try {
      const response = await axios.post(finalUrl, payload, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, messageId: response.data?.messages?.[0]?.id };
    } catch (error) {
      console.error('[WhatsAppService] Error sending template message:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.response?.data?.error || 'Failed to send template message');
    }
  }

  async sendCustomMessage(backendUrl, apiToken, to, message, variables = {}) {
    const axios = require('axios');
    
    // Replace variables in message text like {{1}}, {{2}} if any
    let finalMessage = message;
    Object.keys(variables).forEach(key => {
      finalMessage = finalMessage.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), variables[key]);
    });

    const payload = {
      type: 'text',
      to: to.replace(/\D/g, ''),
      text: {
        body: finalMessage
      }
    };

    const finalUrl = backendUrl.replace('{{token}}', apiToken);

    try {
      const response = await axios.post(finalUrl, payload, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, messageId: response.data?.messages?.[0]?.id };
    } catch (error) {
      console.error('[WhatsAppService] Error sending custom message:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.response?.data?.error || 'Failed to send custom message');
    }
  }
}

module.exports = new WhatsAppService();
