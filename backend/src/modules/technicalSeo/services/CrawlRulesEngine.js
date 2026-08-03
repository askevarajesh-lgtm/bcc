/**
 * CrawlRulesEngine
 * Evaluates inclusion/exclusion rules, regex, parameter stripping, etc.
 */

class CrawlRulesEngine {
  /**
   * @param {Object} rules 
   * @param {string[]} rules.includePatterns - Array of regex strings to include
   * @param {string[]} rules.excludePatterns - Array of regex strings to exclude
   * @param {string[]} rules.stripParameters - Query parameters to strip
   * @param {boolean} rules.respectNoindex - Should crawler skip noindex (default true)
   */
  constructor(rules = {}) {
    this.includeRegexes = (rules.includePatterns || []).map(p => new RegExp(p, 'i'));
    this.excludeRegexes = (rules.excludePatterns || []).map(p => new RegExp(p, 'i'));
    this.stripParameters = rules.stripParameters || [];
    this.respectNoindex = rules.respectNoindex !== false;
  }

  /**
   * Check if a URL should be crawled based on inclusion/exclusion patterns.
   * @param {string} url 
   * @returns {boolean}
   */
  isAllowed(url) {
    // If include patterns exist, URL must match at least one
    if (this.includeRegexes.length > 0) {
      const matchesInclude = this.includeRegexes.some(r => r.test(url));
      if (!matchesInclude) return false;
    }

    // URL must not match any exclude pattern
    if (this.excludeRegexes.length > 0) {
      const matchesExclude = this.excludeRegexes.some(r => r.test(url));
      if (matchesExclude) return false;
    }

    return true;
  }

  /**
   * Normalize URL (strip tracking params, fragments).
   * @param {string} rawUrl 
   * @returns {string} normalized URL
   */
  normalize(rawUrl) {
    try {
      const urlObj = new URL(rawUrl);
      
      // Always strip fragment
      urlObj.hash = '';

      // Strip configured parameters (e.g. utm_source, sessionid)
      for (const param of this.stripParameters) {
        urlObj.searchParams.delete(param);
      }

      return urlObj.toString();
    } catch (e) {
      return rawUrl;
    }
  }
}

module.exports = CrawlRulesEngine;
