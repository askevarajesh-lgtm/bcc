/**
 * RenderingProvider
 * Abstract interface for fetching and rendering page content.
 */

class RenderingProvider {
  /**
   * Fetch and render a URL.
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<{
   *   html: string,
   *   status: number,
   *   headers: Object,
   *   renderedHtml?: string,
   *   screenshotUrl?: string,
   *   clientErrors?: any[],
   *   loadTimeMs?: number
   * }>}
   */
  async render(url, options = {}) {
    throw new Error('Method "render" must be implemented.');
  }

  /**
   * Check if this provider requires a fully qualified browser environment.
   */
  get isBrowser() {
    return false;
  }
}

module.exports = RenderingProvider;
