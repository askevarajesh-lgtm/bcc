/**
 * Competitor Provider Chain
 *
 * The single dependency `comparisonEngine.service.js` is allowed to import.
 * Tries each registered provider in order and falls through to the next on
 * "unconfigured", "threw", or "returned nothing" — the exact same pattern
 * `keywordProviderChain.js` already established for keyword features.
 *
 *   Comparison Engine → Competitor Provider (this file) → DataForSEO
 *                                                        → Semrush
 *                                                        → Future providers
 *
 * Adding a provider = require it here, push it into PROVIDERS. Nothing
 * above this file changes.
 */
const logger = require('../../aiCore/logger.service');

const dataForSeoProvider = require('./dataForSeoCompetitorProvider');
const semrushProvider = require('./semrushCompetitorProvider');

const TAG = 'CompetitorProviderChain';

// Ordered fallback chain. Future providers (Ahrefs, GSC) get appended here.
const PROVIDERS = [dataForSeoProvider, semrushProvider];

function isEmpty(result) {
  if (result == null) return true;
  if (Array.isArray(result)) return result.length === 0;
  return false;
}

/**
 * Runs `methodName(...args)` against each configured provider in order,
 * returning the first non-empty result. Never throws for "no provider had
 * data" — returns an empty array so callers don't need try/catch.
 *
 * @param {string} methodName - one of the CompetitorProviderInterface methods
 * @param {Array} args
 * @returns {Promise<{ data: any, providerId: string|null }>}
 */
async function callChain(methodName, args) {
  for (const provider of PROVIDERS) {
    if (!provider.isConfigured) continue;
    try {
      const data = await provider[methodName](...args);
      if (!isEmpty(data)) {
        return { data, providerId: provider.id };
      }
      logger.debug(TAG, `${provider.id}.${methodName} returned no data, trying next provider`);
    } catch (error) {
      logger.warn(TAG, `${provider.id}.${methodName} failed: ${error.message}, trying next provider`);
    }
  }
  return { data: methodName === 'getOverview' ? null : [], providerId: null };
}

/** @returns {boolean} true if at least one provider in the chain is usable right now */
function hasAnyConfiguredProvider() {
  return PROVIDERS.some((p) => p.isConfigured);
}

module.exports = {
  getOverview: (domain, opts) => callChain('getOverview', [domain, opts]),
  getKeywordGap: (yourDomain, competitorDomain, opts) => callChain('getKeywordGap', [yourDomain, competitorDomain, opts]),
  getContentGap: (yourDomain, competitorDomain, opts) => callChain('getContentGap', [yourDomain, competitorDomain, opts]),
  getBacklinkGap: (yourDomain, competitorDomain, opts) => callChain('getBacklinkGap', [yourDomain, competitorDomain, opts]),
  getPageGap: (yourDomain, competitorDomain, opts) => callChain('getPageGap', [yourDomain, competitorDomain, opts]),
  hasAnyConfiguredProvider,
  PROVIDERS // exposed for tests / diagnostics only
};
