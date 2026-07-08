const axios = require('axios');

class WordPressService {
  constructor(wpRestApiUrl, wpUsername, wpAppPassword) {
    this.wpRestApiUrl = wpRestApiUrl || '';
    this.wpUsername = wpUsername || '';
    this.wpAppPassword = wpAppPassword || '';
    
    this.configured = !!(this.wpRestApiUrl && this.wpUsername && this.wpAppPassword);
  }

  async publishDraft(title, content) {
    if (!this.configured) {
      // Mock success for demo purposes if credentials aren't set
      console.warn('[WordPressService] Not configured! Returning mock success.');
      return { id: Math.floor(Math.random() * 1000), link: `${this.wpRestApiUrl || 'https://example.com'}/?p=123` };
    }

    try {
      const auth = Buffer.from(`${this.wpUsername}:${this.wpAppPassword}`).toString('base64');
      
      const response = await axios.post(`${this.wpRestApiUrl}/wp/v2/posts`, {
        title: title,
        content: content,
        status: 'draft' // Post as draft so user can review in WP
      }, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('[WordPressService] Error publishing to WordPress:', error.response?.data || error.message);
      throw new Error(`WordPress API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async publishTaskUpdate(taskType, proposedChanges) {
    if (!this.configured) {
      console.warn('[WordPressService] Not configured! Mocking task update success.');
      return { success: true, mocked: true };
    }

    try {
      const auth = Buffer.from(`${this.wpUsername}:${this.wpAppPassword}`).toString('base64');
      const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      };

      // Since we don't have the actual WP Page ID, for demo/phase 3 we will create a new draft 
      // or if we had a page ID we'd use PUT /wp/v2/pages/:id
      // We will emulate updating by creating a draft post containing the updates for review.

      let updatePayload = {};

      if (taskType === 'Update Meta Tags') {
        // Requires mu-plugins/seo-rest-meta.php to be active on WP
        updatePayload = {
          title: proposedChanges.title,
          meta: {
            _yoast_wpseo_title: proposedChanges.title,
            _yoast_wpseo_metadesc: proposedChanges.metaDescription,
            rank_math_title: proposedChanges.title,
            rank_math_description: proposedChanges.metaDescription
          },
          status: 'draft'
        };
      } else if (taskType === 'Content Edit') {
        updatePayload = {
          content: proposedChanges.contentBlock,
          status: 'draft'
        };
      } else {
        return { success: false, reason: 'Unsupported task type for automated WP publish' };
      }

      const response = await axios.post(`${this.wpRestApiUrl}/wp/v2/pages`, updatePayload, {
        headers,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('[WordPressService] Error updating WordPress:', error.response?.data || error.message);
      throw new Error(`WordPress API Error: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = WordPressService;
