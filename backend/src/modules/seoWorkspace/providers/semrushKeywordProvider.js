/**
 * Semrush Keyword Provider
 *
 * Fallback adapter for `keywordProviderChain.js`, used when DataForSEO is
 * unconfigured or fails/returns nothing. Semrush's `semrush.service.js`
 * returns semicolon-CSV-derived objects with short column codes (Nq, Kd,
 * Cp, In...) — this file is the only place that knows those codes.
 *
 * Semrush has no dedicated "suggestions"/"ideas" split or a difficulty-only
 * endpoint the way DataForSEO does, and no monthly-trend series, so those
 * methods degrade gracefully (ideas mirrors suggestions; difficulty/volume
 * are read off the same `getKeywordResearch` call; monthlySearches is
 * always empty for this provider).
 */
const semrushService = require('../../semrush/semrush.service');

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeIntent(raw) {
  const v = (raw || '').toString().toLowerCase();
  if (v.includes('transactional')) return 'transactional';
  if (v.includes('commercial')) return 'commercial';
  if (v.includes('navigational')) return 'navigational';
  if (v.includes('informational')) return 'informational';
  return 'unknown';
}

function normalizeCandidate(row) {
  const keyword = row.Keyword || row.keyword;
  if (!keyword) return null;
  return {
    keyword,
    searchVolume: toNumber(row['Search Volume'] ?? row.searchVolume),
    cpc: toNumber(row.CPC ?? row.cpc),
    competition: toNumber(row['Competitive Density'] ?? row.Co) || 0,
    intent: normalizeIntent(row.Intent ?? row.intent),
    keywordDifficulty: toNumber(row['Keyword Difficulty Index'] ?? row.difficulty),
    monthlySearches: []
  };
}

class SemrushKeywordProvider {
  get id() { return 'semrush'; }

  get isConfigured() { return Boolean(process.env.SEMRUSH_API_KEY); }

  async getSuggestions(seed, _opts = {}) {
    if (!this.isConfigured) return [];
    const rows = await semrushService.getKeywordResearch(seed);
    return (Array.isArray(rows) ? rows : []).map(normalizeCandidate).filter(Boolean);
  }

  async getIdeas(seed, opts = {}) {
    // Semrush has no separate "ideas" endpoint — same phrase-match call.
    return this.getSuggestions(seed, opts);
  }

  async getDifficulty(keywords, _opts = {}) {
    if (!this.isConfigured) return [];
    const results = [];
    for (const kw of keywords) {
      try {
        const rows = await semrushService.getKeywordResearch(kw);
        const match = (Array.isArray(rows) ? rows : []).find(
          (r) => (r.Keyword || '').toLowerCase() === kw.toLowerCase()
        );
        if (match) results.push({ keyword: kw, keywordDifficulty: toNumber(match['Keyword Difficulty Index']) });
      } catch (_) { /* skip, let the chain / caller handle partial results */ }
    }
    return results;
  }

  async getSearchVolume(keywords, opts = {}) {
    const candidates = await this.getDifficulty(keywords, opts); // reuses the same lookup path
    return candidates.map((c) => ({ ...c, searchVolume: 0, cpc: 0, competition: 0, intent: 'unknown', monthlySearches: [] }));
  }

  async getSerpResults(_tasks, _opts = {}) {
    // Not supported by this provider — chain falls through to the next one.
    return [];
  }

  async getRankedKeywords(domain, opts = {}) {
    if (!this.isConfigured) return [];
    const rows = await semrushService.getDomainKeywordsDrilldown(domain, opts.database || 'us', opts.limit || 100);
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      keyword: r.keyword || '',
      rank: toNumber(r.position) || null,
      searchVolume: toNumber(r.searchVolume),
      url: r.url || null
    }));
  }
}

module.exports = new SemrushKeywordProvider();
