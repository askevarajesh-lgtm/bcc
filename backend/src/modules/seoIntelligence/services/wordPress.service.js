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
      } else if (taskType === 'Schema Injection') {
        return this._publishSchemaInjection(pageUrl, proposedChanges, headers);
      } else if (taskType === 'Create Redirect') {
        return this._publishRedirect(pageUrl, proposedChanges, headers);
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

  /**
   * Schema Injection: writes a JSON-LD block into the target page/post's
   * content. There's no universal "schema" REST field across WP SEO plugins
   * (Yoast/Rank Math each use their own custom meta shape for this), so the
   * portable approach — same one Content Edit already relies on — is a
   * <script type="application/ld+json"> block appended to the post content,
   * wrapped in HTML comment markers so a rerun replaces the old block
   * instead of stacking duplicates on every re-approval.
   */
  async _publishSchemaInjection(pageUrl, proposedChanges, headers) {
    const target = await this._getPostIdBySlug(pageUrl, headers);
    if (!target || !target.id) {
      return { success: false, reason: `Could not resolve page/post for ${pageUrl} to inject schema markup.` };
    }

    const schemaJson = typeof proposedChanges.schema === 'string'
      ? proposedChanges.schema
      : JSON.stringify(proposedChanges.schema || proposedChanges, null, 2);

    const marker = { start: '<!-- seo-workspace:schema:start -->', end: '<!-- seo-workspace:schema:end -->' };
    const schemaBlock = `${marker.start}\n<script type="application/ld+json">${schemaJson}</script>\n${marker.end}`;

    const getRes = await axios.get(`${this.wpRestApiUrl}/wp/v2/${target.type}/${target.id}`, { headers, timeout: 10000 });
    const currentContent = getRes.data?.content?.raw ?? getRes.data?.content?.rendered ?? '';

    const hasExistingBlock = currentContent.includes(marker.start) && currentContent.includes(marker.end);
    const blockPattern = new RegExp(`${marker.start}[\\s\\S]*?${marker.end}`);
    const newContent = hasExistingBlock
      ? currentContent.replace(blockPattern, schemaBlock)
      : `${currentContent}\n${schemaBlock}`;

    const response = await axios.put(`${this.wpRestApiUrl}/wp/v2/${target.type}/${target.id}`, {
      content: newContent,
      status: 'publish'
    }, { headers, timeout: 10000 });

    return response.data;
  }

  /**
   * Create Redirect: uses the REST API exposed by the widely-used
   * "Redirection" WordPress plugin at /wp-json/redirection/v1/redirect.
   * If that plugin isn't installed, the request 404s — surfaced as a
   * normal task failure (task.failureReason) rather than silently mocked,
   * since a redirect that "succeeds" without actually existing on the site
   * would be worse than an honest failure.
   */
  async _publishRedirect(pageUrl, proposedChanges, headers) {
    const source = proposedChanges.sourceUrl || pageUrl;
    const target = proposedChanges.targetUrl || proposedChanges.destinationUrl;
    if (!target) {
      return { success: false, reason: 'proposedChanges.targetUrl is required to create a redirect.' };
    }

    try {
      const response = await axios.post(`${this.wpRestApiUrl}/redirection/v1/redirect`, {
        url: source,
        action_data: { url: target },
        action_type: 'url',
        match_type: 'url',
        group_id: proposedChanges.groupId || 1,
        status: 'enabled'
      }, { headers, timeout: 10000 });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Create Redirect failed: the "Redirection" plugin REST endpoint was not found on this WordPress site. Install/activate the Redirection plugin to enable this task type.');
      }
      throw error;
    }
  }
}

module.exports = WordPressService;