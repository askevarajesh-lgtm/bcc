/**
 * StaticHtmlProvider
 * Fastest rendering provider using raw Axios GET requests.
 * Ideal for static sites without JS hydration.
 */
const RenderingProvider = require('./RenderingProvider');
const axios = require('axios');

class StaticHtmlProvider extends RenderingProvider {
  /**
   * Fetch static HTML.
   * @param {string} url 
   * @param {Object} options 
   */
  async render(url, options = {}) {
    const startTime = Date.now();
    try {
      const response = await axios.get(url, {
        timeout: options.timeout || 10000,
        maxRedirects: options.maxRedirects || 5,
        headers: { 'User-Agent': options.userAgent || 'BCC-Enterprise-Crawler/1.0' },
        validateStatus: () => true // Resolve all statuses
      });

      return {
        html: response.data,
        status: response.status,
        headers: response.headers,
        finalUrl: response.request?.res?.responseUrl || url,
        loadTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        html: '',
        status: 0,
        headers: {},
        finalUrl: url,
        error: error.message,
        loadTimeMs: Date.now() - startTime
      };
    }
  }

  get isBrowser() {
    return false;
  }
}

module.exports = StaticHtmlProvider;
