const axios = require('axios');
const publishGateService = require('../../seoWorkspace/services/publishGate.service');

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

  async _getPostIdBySlug(slug, headers) {
    if (!slug || slug === '/') return null;
    const cleanSlug = slug.replace(/^\/|\/$/g, '');
    
    try {
      // Check pages first
      const pagesRes = await axios.get(`${this.wpRestApiUrl}/wp/v2/pages?slug=${cleanSlug}`, { headers, timeout: 5000 });
      if (pagesRes.data && pagesRes.data.length > 0) return { id: pagesRes.data[0].id, type: 'pages' };
      
      // Check posts if not found in pages
      const postsRes = await axios.get(`${this.wpRestApiUrl}/wp/v2/posts?slug=${cleanSlug}`, { headers, timeout: 5000 });
      if (postsRes.data && postsRes.data.length > 0) return { id: postsRes.data[0].id, type: 'posts' };
    } catch (e) {
      console.warn(`[WordPressService] Could not resolve slug ${slug}:`, e.message);
    }
    return null;
  }

  async publishTaskUpdate(projectId, strategyId, taskId, taskType, pageUrl, proposedChanges) {
    if (projectId && strategyId && taskId) {
      await publishGateService.checkStrategyGate(projectId, strategyId);
      await publishGateService.checkTaskGate(projectId, taskId);
    }
    
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
          status: 'publish' // Push live immediately
        };
      } else if (taskType === 'Content Edit') {
        updatePayload = {
          content: proposedChanges.contentBlock,
          status: 'publish' // Push live immediately
        };
      } else {
        return { success: false, reason: 'Unsupported task type for automated WP publish' };
      }

      // Try to find the actual page by slug
      const target = await this._getPostIdBySlug(pageUrl, headers);
      
      let response;
      if (target && target.id) {
        // Live update existing page/post
        response = await axios.put(`${this.wpRestApiUrl}/wp/v2/${target.type}/${target.id}`, updatePayload, {
          headers,
          timeout: 10000
        });
      } else {
        // Fallback: create a new draft if page not found
        console.warn(`[WordPressService] Page URL ${pageUrl} not found. Creating new draft instead.`);
        updatePayload.status = 'draft';
        response = await axios.post(`${this.wpRestApiUrl}/wp/v2/pages`, updatePayload, {
          headers,
          timeout: 10000
        });
      }

      return response.data;
    } catch (error) {
      console.error('[WordPressService] Error updating WordPress:', error.response?.data || error.message);
      throw new Error(`WordPress API Error: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = WordPressService;
