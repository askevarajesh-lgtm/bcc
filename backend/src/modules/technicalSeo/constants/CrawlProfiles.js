/**
 * CrawlProfiles
 * Pre-defined configurations for different audit scales.
 */

const CRAWL_PROFILES = {
  QUICK: {
    maxPages: 10,
    maxDepth: 2,
    concurrency: 5,
    renderingEnabled: false,
    dataForSeoSamplingRate: 1.0, // 100% of these 10 pages
    aiAnalysisLevel: 'basic',
    timeoutMs: 15000,
    retries: 1,
    respectRobots: true,
    customUserAgent: null,
  },
  STANDARD: {
    maxPages: 100,
    maxDepth: 5,
    concurrency: 10,
    renderingEnabled: false,
    dataForSeoSamplingRate: 0.2, // 20% of 100 pages
    aiAnalysisLevel: 'standard',
    timeoutMs: 30000,
    retries: 2,
    respectRobots: true,
    customUserAgent: null,
  },
  ENTERPRISE: {
    maxPages: 10000,
    maxDepth: 20,
    concurrency: 20,
    renderingEnabled: true,
    dataForSeoSamplingRate: 0.05, // 5% of 10,000 pages (intelligent sampling handles which ones)
    aiAnalysisLevel: 'advanced',
    timeoutMs: 45000,
    retries: 3,
    respectRobots: true,
    customUserAgent: 'BCC-Enterprise-Crawler/1.0',
  }
};

/**
 * Merge a custom profile with a base profile.
 */
function getMergedProfile(baseProfileName, customOverrides = {}) {
  const base = CRAWL_PROFILES[baseProfileName.toUpperCase()] || CRAWL_PROFILES.STANDARD;
  return { ...base, ...customOverrides };
}

module.exports = {
  CRAWL_PROFILES,
  getMergedProfile
};
