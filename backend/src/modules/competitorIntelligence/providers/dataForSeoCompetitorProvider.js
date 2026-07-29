/**
 * DataForSEO Competitor Provider
 *
 * Adapter that satisfies `competitorProvider.interface.js` on top of the
 * existing `seoIntelligence/dataForSeo.service.js` HTTP client — the same
 * client `dataForSeoKeywordProvider.js` and `competitorAgent.service.js`
 * already use. This is the ONLY file in this module allowed to know
 * DataForSEO's endpoint/field shapes.
 *
 * DataForSEO has no single "domain intersection" gap endpoint wired up in
 * `dataForSeo.service.js` today, so keyword/content/page gaps are derived
 * honestly from `getRankedKeywords()` for both domains rather than invented:
 * a set-difference on keywords each domain ranks for. This is a documented
 * approximation, not a fabricated metric — every number returned (rank,
 * search volume) comes directly from a real API response.
 */
const dataForSeoService = require('../../seoIntelligence/dataForSeo.service');

const RANKED_KEYWORDS_LIMIT = 200;

function normalizeDomain(domain) {
  return (domain || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
}

function toRankedMap(items) {
  // keyword -> { rank, searchVolume, url }
  const map = new Map();
  (items || []).forEach((item) => {
    const kw = item.keyword_data?.keyword;
    if (!kw) return;
    const rankInfo = item.ranked_serp_element?.serp_item || {};
    map.set(kw.toLowerCase(), {
      keyword: kw,
      rank: rankInfo.rank_absolute || rankInfo.rank_group || null,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
      url: rankInfo.url || null
    });
  });
  return map;
}

class DataForSeoCompetitorProvider {
  get id() { return 'dataforseo'; }

  get isConfigured() { return dataForSeoService.isConfigured; }

  async getOverview(domain, opts = {}) {
    const target = normalizeDomain(domain);
    const overview = await dataForSeoService.getDomainOverview(target, opts.locationCode, opts.languageCode);
    if (!overview) return null;
    return {
      domain: target,
      organicKeywords: overview.metrics?.organic?.count || 0,
      organicTraffic: overview.metrics?.organic?.etv || 0,
      organicCost: overview.metrics?.organic?.estimated_paid_traffic_cost || 0,
      domainRank: overview.metrics?.organic?.pos_1 ? overview.metrics.organic.pos_1 : (overview.avg_position || 0)
    };
  }

  async _rankedKeywordGap(yourDomain, competitorDomain, opts) {
    const you = normalizeDomain(yourDomain);
    const them = normalizeDomain(competitorDomain);

    const [yourItems, theirItems] = await Promise.all([
      dataForSeoService.getRankedKeywords(you, RANKED_KEYWORDS_LIMIT, opts.locationCode, opts.languageCode),
      dataForSeoService.getRankedKeywords(them, RANKED_KEYWORDS_LIMIT, opts.locationCode, opts.languageCode)
    ]);

    const yourMap = toRankedMap(yourItems);
    const theirMap = toRankedMap(theirItems);

    const rows = [];
    theirMap.forEach((theirEntry, kwLower) => {
      const yourEntry = yourMap.get(kwLower);
      // A gap: competitor ranks and you either don't rank at all, or rank worse.
      if (!yourEntry || (theirEntry.rank != null && yourEntry.rank != null && theirEntry.rank < yourEntry.rank)) {
        rows.push({
          keyword: theirEntry.keyword,
          pageUrl: yourEntry ? null : theirEntry.url,
          referringDomain: null,
          ownRank: yourEntry ? yourEntry.rank : null,
          competitorRank: theirEntry.rank,
          searchVolume: theirEntry.searchVolume || 0,
          competitorDomain: them
        });
      }
    });

    return { rows, yourMap, theirMap };
  }

  async getKeywordGap(yourDomain, competitorDomain, opts = {}) {
    const { rows } = await this._rankedKeywordGap(yourDomain, competitorDomain, opts);
    return rows.map((r) => ({ ...r, type: 'keyword_gap' }));
  }

  async getContentGap(yourDomain, competitorDomain, opts = {}) {
    // Content gap ≈ keyword gaps where the competitor has an entire ranking
    // page (url) that you have no equivalent page for at all — a proxy for
    // "missing content", not a crawl-based topic diff (no crawl-based
    // content-gap tool exists in this codebase yet).
    const { rows } = await this._rankedKeywordGap(yourDomain, competitorDomain, opts);
    return rows
      .filter((r) => r.pageUrl && r.ownRank == null)
      .map((r) => ({ ...r, type: 'content_gap' }));
  }

  async getPageGap(yourDomain, competitorDomain, opts = {}) {
    // Page-level view of the same underlying ranked-keyword data, deduped by
    // competitor page URL rather than by keyword.
    const { rows } = await this._rankedKeywordGap(yourDomain, competitorDomain, opts);
    const byUrl = new Map();
    rows.filter((r) => r.pageUrl).forEach((r) => {
      if (!byUrl.has(r.pageUrl)) byUrl.set(r.pageUrl, { ...r, type: 'page_gap' });
    });
    return Array.from(byUrl.values());
  }

  async getBacklinkGap(yourDomain, competitorDomain, opts = {}) {
    const you = normalizeDomain(yourDomain);
    const them = normalizeDomain(competitorDomain);
    const limit = opts.limit || 50;

    const [yourDomains, theirDomains] = await Promise.all([
      dataForSeoService.getReferringDomains(you, limit),
      dataForSeoService.getReferringDomains(them, limit)
    ]);

    const yourSet = new Set((yourDomains || []).map((d) => (d.domain || d.referring_domain || '').toLowerCase()).filter(Boolean));

    return (theirDomains || [])
      .map((d) => ({
        domain: d.domain || d.referring_domain,
        rank: d.rank || d.domain_rank || 0
      }))
      .filter((d) => d.domain && !yourSet.has(d.domain.toLowerCase()))
      .map((d) => ({
        type: 'backlink_gap',
        keyword: null,
        pageUrl: null,
        referringDomain: d.domain,
        ownRank: null,
        competitorRank: d.rank,
        searchVolume: 0,
        competitorDomain: them
      }));
  }
}

module.exports = new DataForSeoCompetitorProvider();
