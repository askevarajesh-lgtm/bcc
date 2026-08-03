/**
 * AI Core — URL utilities
 *
 * Lifted verbatim (in behavior) from
 * `seoWorkspace/services/internalLinkingAgent.service.js`'s inline
 * `normalizeUrl`/`pairKey`, which is the exact reuse the architecture plan
 * calls for in `LinkAnalyzer`. Generalized here so any analyzer/provider can
 * share one implementation instead of each having its own copy.
 */

function normalizeUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.hash = '';
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    return `${u.origin}${pathname}${u.search}`;
  } catch (error) {
    return url;
  }
}

function pairKey(sourceUrl, targetUrl) {
  return `${normalizeUrl(sourceUrl)}=>${normalizeUrl(targetUrl)}`;
}

function toAbsoluteHttpUrl(siteUrl) {
  return /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
}

module.exports = { normalizeUrl, pairKey, toAbsoluteHttpUrl, hostnameOf };
