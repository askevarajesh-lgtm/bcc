/**
 * AI Core — Fix Engine — Verification Engine
 *
 * Intentionally thin (Architecture Refinements v2 §3): `verify(taskType,
 * category, affectedPages)` looks up the category in `verifierRegistry` ->
 * re-runs that existing function against just the affected URLs (not a full
 * site crawl, not a full agent run) -> interprets the fresh signal -> returns
 * `{ status: 'Verified' | 'Failed' | 'Inconclusive', details }`.
 *
 * No auto-loop. If verification fails, nothing retries automatically — the
 * caller (owning module) is responsible for setting `task.verification` from
 * the returned status and raising a notification on 'Failed'.
 */
const verifierRegistry = require('./verifierRegistry');

/**
 * Category-specific interpretation of a recheck function's raw result into
 * a per-page { status, reason }. Kept here (not in the registry) so the
 * registry stays a pure lookup table of reused functions, per §3.
 */
const INTERPRETERS = {
  robots_txt: (result) => {
    if (!result || !result.robotsTxt) return { status: 'Inconclusive', reason: 'robots.txt recheck returned no data' };
    return result.robotsTxt.disallowsAll
      ? { status: 'Failed', reason: 'robots.txt still disallows all crawling' }
      : { status: 'Verified', reason: 'robots.txt no longer disallows all crawling' };
  },
  sitemap: (result) => {
    if (!result || !result.sitemap) return { status: 'Inconclusive', reason: 'sitemap recheck returned no data' };
    return result.sitemap.exists
      ? { status: 'Verified', reason: `sitemap found (${result.sitemap.urlCount} URLs)` }
      : { status: 'Failed', reason: 'sitemap still not found' };
  },
  canonical_issues: (result) => {
    if (!result || result.error) return { status: 'Inconclusive', reason: result?.error || 'page recheck failed' };
    return result.canonical
      ? { status: 'Verified', reason: 'canonical tag now present' }
      : { status: 'Failed', reason: 'canonical tag still missing' };
  },
  core_web_vitals: (result) => {
    const score = result?.categories?.performance?.score;
    if (typeof score !== 'number') return { status: 'Inconclusive', reason: 'no Lighthouse performance score available' };
    return score >= 0.5
      ? { status: 'Verified', reason: `performance score ${score} at or above threshold` }
      : { status: 'Failed', reason: `performance score ${score} still below threshold` };
  },
  broken_links: (result) => {
    if (!result || result.error) return { status: 'Inconclusive', reason: result?.error || 'page recheck failed' };
    return result.status === 200
      ? { status: 'Verified', reason: 'page now resolves with a 200 status' }
      : { status: 'Failed', reason: `page still resolves with status ${result.status}` };
  },
  missing_meta: (result) => {
    if (!result || result.error) return { status: 'Inconclusive', reason: result?.error || 'page recheck failed' };
    return result.meta_description
      ? { status: 'Verified', reason: 'meta description now present' }
      : { status: 'Failed', reason: 'meta description still missing' };
  },
  structured_data: (result) => {
    if (!result) return { status: 'Inconclusive', reason: 'structured data recheck returned no data' };
    return result.valid
      ? { status: 'Verified', reason: 'structured data now passes validation' }
      : { status: 'Failed', reason: `structured data still fails validation: ${(result.errors || []).join('; ')}` };
  }
};

function defaultInterpreter(result) {
  return { status: 'Inconclusive', reason: 'no interpreter registered for this category' };
}

/**
 * @param {string} taskType - for context/telemetry only
 * @param {string} category - e.g. 'robots_txt', 'canonical_issues'
 * @param {string[]} affectedPages - specific URLs to recheck, not a full crawl
 * @returns {Promise<{status: 'Verified'|'Failed'|'Inconclusive', details: string}>}
 */
async function verify(taskType, category, affectedPages) {
  if (!Array.isArray(affectedPages) || affectedPages.length === 0) {
    return { status: 'Inconclusive', details: 'No affected pages supplied to verify.' };
  }

  const fn = verifierRegistry.get(category);
  if (!fn) {
    return { status: 'Inconclusive', details: `No verifier registered yet for category "${category}".` };
  }

  const interpret = INTERPRETERS[category] || defaultInterpreter;

  const results = await Promise.all(affectedPages.map(async (url) => {
    try {
      const result = await fn(url);
      return { url, ...interpret(result) };
    } catch (error) {
      return { url, status: 'Inconclusive', reason: `recheck threw: ${error.message}` };
    }
  }));

  const anyFailed = results.some((r) => r.status === 'Failed');
  const anyInconclusive = results.some((r) => r.status === 'Inconclusive');
  // A single still-broken page fails the whole task; "inconclusive" only wins
  // when nothing failed outright but we also couldn't confirm every page.
  const status = anyFailed ? 'Failed' : (anyInconclusive ? 'Inconclusive' : 'Verified');

  return {
    status,
    details: `[${taskType}/${category}] ` + results.map((r) => `${r.url}: ${r.status} (${r.reason})`).join(' | ')
  };
}

module.exports = { verify };
