/**
 * Domain and URL Normalization Engine
 */

class DomainNormalizationEngine {
  /**
   * Normalizes a URL into a clean domain format for exact comparison.
   * Strips protocols (http/https), www, paths, query strings, fragments, and trailing slashes.
   * e.g. "https://www.example.com/path?q=1#hash" -> "example.com"
   * @param {string} rawUrl 
   * @returns {string}
   */
  normalizeDomain(rawUrl) {
    if (!rawUrl) return '';
    try {
      // Handle cases where protocol is missing
      const withProtocol = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
      const urlObj = new URL(withProtocol);
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      return hostname;
    } catch (err) {
      // Fallback regex if URL parsing fails
      let cleaned = rawUrl.toLowerCase().trim();
      cleaned = cleaned.replace(/^https?:\/\//, '');
      cleaned = cleaned.replace(/^www\./, '');
      cleaned = cleaned.split('/')[0];
      cleaned = cleaned.split('?')[0];
      cleaned = cleaned.split('#')[0];
      return cleaned;
    }
  }

  /**
   * Checks if a SERP result URL belongs to the project domain.
   * Exact matching is used on the normalized domains to prevent false positives (e.g. "example.com" vs "myexample.com").
   * Subdomains are considered matches (e.g. "blog.example.com" matches "example.com").
   * @param {string} serpUrl 
   * @param {string} projectDomain 
   * @returns {boolean}
   */
  isDomainMatch(serpUrl, projectDomain) {
    const normalizedSerp = this.normalizeDomain(serpUrl);
    const normalizedProject = this.normalizeDomain(projectDomain);

    if (!normalizedSerp || !normalizedProject) return false;
    
    return normalizedSerp === normalizedProject || normalizedSerp.endsWith(`.${normalizedProject}`);
  }

  /**
   * Normalizes a full URL for storage and exact path comparison (preserves path, strips fragment/query if needed)
   * @param {string} rawUrl 
   * @param {boolean} stripQuery 
   * @returns {string}
   */
  normalizeUrl(rawUrl, stripQuery = false) {
    if (!rawUrl) return '';
    try {
      const withProtocol = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      const urlObj = new URL(withProtocol);
      urlObj.hash = ''; // Always strip fragments
      if (stripQuery) {
        urlObj.search = '';
      }
      return urlObj.toString().replace(/\/$/, ''); // strip trailing slash
    } catch (err) {
      return rawUrl.trim().replace(/\/$/, '');
    }
  }
}

module.exports = new DomainNormalizationEngine();
