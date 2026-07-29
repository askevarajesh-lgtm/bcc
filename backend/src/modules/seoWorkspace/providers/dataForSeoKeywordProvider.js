/**
 * DataForSEO Keyword Provider
 *
 * Adapter that satisfies `keywordProvider.interface.js` on top of the
 * existing `seoIntelligence/dataForSeo.service.js` HTTP client. This is the
 * ONLY file allowed to know that DataForSEO's search-intent field is called
 * `search_intent_info.main_intent`, that difficulty comes from
 * `bulk_keyword_difficulty`, etc. — every other keyword-feature file talks
 * to `keywordProviderChain.js` instead.
 */
const dataForSeoService = require('../../seoIntelligence/dataForSeo.service');

const VALID_INTENTS = ['informational', 'navigational', 'commercial', 'transactional', 'unknown'];

function normalizeIntent(raw) {
  const v = (raw || 'unknown').toLowerCase();
  return VALID_INTENTS.includes(v) ? v : 'unknown';
}

function normalizeCandidate(item) {
  const kw = item.keyword || item.keyword_data?.keyword;
  if (!kw) return null;
  const info = item.keyword_info || item.keyword_data?.keyword_info || {};
  return {
    keyword: kw,
    searchVolume: info.search_volume || 0,
    cpc: info.cpc || 0,
    competition: info.competition || 0,
    intent: normalizeIntent(info.search_intent_info?.main_intent),
    keywordDifficulty: 0, // filled in separately via getDifficulty
    monthlySearches: (info.monthly_searches || []).map((m) => ({
      month: m.month, year: m.year, searchVolume: m.search_volume || 0
    }))
  };
}

class DataForSeoKeywordProvider {
  get id() { return 'dataforseo'; }

  get isConfigured() { return dataForSeoService.isConfigured; }

  async getSuggestions(seed, opts = {}) {
    const items = await dataForSeoService.getKeywordSuggestions(
      seed, opts.locationCode, opts.languageCode, opts.limit
    );
    return items.map(normalizeCandidate).filter(Boolean);
  }

  async getIdeas(seed, opts = {}) {
    const items = await dataForSeoService.getKeywordIdeas(
      seed, opts.locationCode, opts.languageCode, opts.limit
    );
    return items.map(normalizeCandidate).filter(Boolean);
  }

  async getDifficulty(keywords, opts = {}) {
    const items = await dataForSeoService.getKeywordDifficulty(
      keywords, opts.locationCode, opts.languageCode
    );
    return items.map((d) => ({
      keyword: d.keyword || '',
      keywordDifficulty: d.keyword_difficulty || 0
    }));
  }

  async getSearchVolume(keywords, opts = {}) {
    const items = await dataForSeoService.getSearchVolume(
      keywords, opts.locationCode, opts.languageCode
    );
    return items.map((item) => ({
      keyword: item.keyword || '',
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      intent: 'unknown',
      keywordDifficulty: 0,
      monthlySearches: (item.monthly_searches || []).map((m) => ({
        month: m.month, year: m.year, searchVolume: m.search_volume || 0
      }))
    }));
  }

  async getSerpResults(tasks, _opts = {}) {
    const raw = await dataForSeoService.getSerpResults(tasks);
    return raw.map((task) => {
      const result = task.result?.[0] || {};
      const items = result.items || [];
      const organic = items.filter((i) => i.type === 'organic');
      const paa = items.find((i) => i.type === 'people_also_ask');
      const featured = items.find((i) => i.type === 'featured_snippet');
      const related = items.find((i) => i.type === 'related_searches');

      return {
        keyword: result.keyword || task.data?.keyword || '',
        topResults: organic.slice(0, 10).map((o) => ({
          domain: o.domain || null, title: o.title || null, url: o.url || null, rank: o.rank_absolute || o.rank_group || null
        })),
        featuredSnippet: featured
          ? { domain: featured.domain || null, url: featured.url || null, text: featured.description || featured.text || null }
          : null,
        paaQuestions: (paa?.items || []).map((q) => q.title).filter(Boolean),
        relatedSearches: (related?.items || []).map((r) => (typeof r === 'string' ? r : r.title)).filter(Boolean)
      };
    });
  }

  async getRankedKeywords(domain, opts = {}) {
    const items = await dataForSeoService.getRankedKeywords(domain, opts.limit, opts.locationCode, opts.languageCode);
    return items.map((item) => {
      const kwData = item.keyword_data || {};
      const rankInfo = item.ranked_serp_element?.serp_item || {};
      return {
        keyword: kwData.keyword || '',
        rank: rankInfo.rank_absolute || rankInfo.rank_group || null,
        searchVolume: kwData.keyword_info?.search_volume || 0,
        url: rankInfo.url || null
      };
    });
  }
}

module.exports = new DataForSeoKeywordProvider();
