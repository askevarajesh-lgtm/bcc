/**
 * Semrush Competitor Provider
 *
 * Fallback adapter for `competitorProviderChain.js`, used when DataForSEO is
 * unconfigured or fails/returns nothing — mirrors `semrushKeywordProvider.js`'s
 * degrade-gracefully approach. Semrush has no ranked-keywords-by-domain-diff
 * endpoint wired up in `semrush.service.js` today beyond
 * `getDomainKeywordsDrilldown`, so keyword/content/page gaps use that; there's
 * no per-page URL in Semrush's keyword drilldown rows, so `pageUrl` is always
 * null for this provider's content/page gap rows (never fabricated).
 */
const semrushService = require('../../semrush/semrush.service');

function normalizeDomain(domain) {
  return (domain || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toKeywordMap(rows) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const kw = row.Keyword || row.keyword;
    if (!kw) return;
    map.set(kw.toLowerCase(), {
      keyword: kw,
      rank: toNumber(row.Position ?? row.position) || null,
      searchVolume: toNumber(row['Search Volume'] ?? row.searchVolume)
    });
  });
  return map;
}

class SemrushCompetitorProvider {
  get id() { return 'semrush'; }

  get isConfigured() { return Boolean(process.env.SEMRUSH_API_KEY); }

  async getOverview(domain) {
    if (!this.isConfigured) return null;
    const target = normalizeDomain(domain);
    const overview = await semrushService.getDomainOverview(target);
    if (!overview) return null;
    return {
      domain: target,
      organicKeywords: toNumber(overview.Or ?? overview.organicKeywords),
      organicTraffic: toNumber(overview.Ot ?? overview.organicTraffic),
      organicCost: toNumber(overview.Oc ?? overview.organicCost),
      domainRank: toNumber(overview.Rk ?? overview.domainRank)
    };
  }

  async _keywordGapRows(yourDomain, competitorDomain) {
    if (!this.isConfigured) return [];
    const you = normalizeDomain(yourDomain);
    const them = normalizeDomain(competitorDomain);

    const [yourRows, theirRows] = await Promise.all([
      semrushService.getDomainKeywordsDrilldown(you),
      semrushService.getDomainKeywordsDrilldown(them)
    ]);

    const yourMap = toKeywordMap(yourRows);
    const theirMap = toKeywordMap(theirRows);

    const rows = [];
    theirMap.forEach((theirEntry, kwLower) => {
      const yourEntry = yourMap.get(kwLower);
      if (!yourEntry || (theirEntry.rank != null && yourEntry.rank != null && theirEntry.rank < yourEntry.rank)) {
        rows.push({
          keyword: theirEntry.keyword,
          pageUrl: null, // Semrush's keyword drilldown has no per-page URL
          referringDomain: null,
          ownRank: yourEntry ? yourEntry.rank : null,
          competitorRank: theirEntry.rank,
          searchVolume: theirEntry.searchVolume || 0,
          competitorDomain: them
        });
      }
    });
    return rows;
  }

  async getKeywordGap(yourDomain, competitorDomain) {
    const rows = await this._keywordGapRows(yourDomain, competitorDomain);
    return rows.map((r) => ({ ...r, type: 'keyword_gap' }));
  }

  async getContentGap(yourDomain, competitorDomain) {
    // No page URL available from this provider — content gap degrades to
    // "keyword you don't rank for at all" rather than a page-level signal.
    const rows = await this._keywordGapRows(yourDomain, competitorDomain);
    return rows.filter((r) => r.ownRank == null).map((r) => ({ ...r, type: 'content_gap' }));
  }

  async getPageGap() {
    // Genuinely no page-level data available from Semrush's wired-up
    // endpoints — return empty rather than fabricate page URLs.
    return [];
  }

  async getBacklinkGap(yourDomain, competitorDomain) {
    if (!this.isConfigured) return [];
    const you = normalizeDomain(yourDomain);
    const them = normalizeDomain(competitorDomain);

    const [yourSummary, theirSummary] = await Promise.all([
      semrushService.getBacklinksOverview(you),
      semrushService.getBacklinksOverview(them)
    ]);

    // getBacklinksOverview returns an overview, not a referring-domains list,
    // in this codebase today — so a true per-domain diff isn't possible from
    // this provider. Surface the aggregate gap in referring-domain COUNT only
    // (never a fabricated per-domain list) so the chain still returns
    // something useful instead of silently empty.
    const yourCount = toNumber(yourSummary?.referring_domains ?? yourSummary?.ReferringDomains);
    const theirCount = toNumber(theirSummary?.referring_domains ?? theirSummary?.ReferringDomains);
    if (theirCount <= yourCount) return [];

    return [{
      type: 'backlink_gap',
      keyword: null,
      pageUrl: null,
      referringDomain: null, // count-level gap only, no domain list from this provider
      ownRank: yourCount,
      competitorRank: theirCount,
      searchVolume: 0,
      competitorDomain: them
    }];
  }
}

module.exports = new SemrushCompetitorProvider();
