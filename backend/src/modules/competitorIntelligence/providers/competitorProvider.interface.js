/**
 * Competitor Provider — Interface
 *
 * The contract every competitor/comparison data source must satisfy to plug
 * into `competitorProviderChain.js`. Mirrors `seoWorkspace/providers/keywordProvider.interface.js`
 * exactly, so `comparisonEngine.service.js` (the layer every AI SEO Platform
 * feature calls into) never imports `dataForSeo.service.js` or
 * `semrush.service.js` directly:
 *
 *   Comparison Engine → Competitor Provider (this contract) → DataForSEO
 *                                                             → Semrush
 *                                                             → Future providers (Ahrefs, GSC)
 *
 * Every method must:
 *   - Never throw for "no data" — return an empty array/null, so the chain
 *     can fall through to the next provider without try/catch at every call site.
 *   - Only throw for genuine failures (auth, network, rate-limit) that the
 *     chain should log and fall through on anyway.
 *   - Return data already normalized to the shapes documented below —
 *     provider-specific field names must not leak past the adapter.
 *   - Never fabricate metrics. If a number genuinely isn't available from
 *     this provider, return 0/null rather than inventing a plausible value
 *     (same convention already enforced in `competitorAgent.service.js`).
 *
 * Normalized shapes:
 *
 *   DomainOverview = {
 *     domain: string,
 *     organicKeywords: number,
 *     organicTraffic: number,
 *     organicCost: number,
 *     domainRank: number
 *   }
 *
 *   ComparisonRow = {
 *     type: 'keyword_gap'|'content_gap'|'backlink_gap'|'page_gap',
 *     keyword: string | null,       // set for keyword_gap/content_gap rows
 *     pageUrl: string | null,       // set for content_gap/page_gap rows, where known
 *     referringDomain: string|null,// set for backlink_gap rows
 *     ownRank: number | null,       // your domain's rank/status for this row, null = doesn't rank/have it
 *     competitorRank: number | null,
 *     searchVolume: number,         // 0 if unknown — never fabricated
 *     competitorDomain: string
 *   }
 *
 *   ComparisonResult = {
 *     domains: string[],            // [yourDomain, competitorDomain, ...]
 *     type: 'keyword_gap'|'content_gap'|'backlink_gap'|'page_gap'|'overview',
 *     rows: ComparisonRow[],
 *     summary: {
 *       totalGaps: number,
 *       byType: Object              // present only for the 'overview' aggregate
 *     },
 *     overview: DomainOverview[] | null, // populated for type === 'overview'
 *     creditsUsed: number | null     // from the provider's response metadata, where available
 *   }
 */

class CompetitorProviderInterface {
  /** @returns {string} short id used in cache keys / logs, e.g. 'dataforseo' */
  get id() { throw new Error('Provider must implement id'); }

  /** @returns {boolean} whether this provider has usable credentials right now */
  get isConfigured() { throw new Error('Provider must implement isConfigured'); }

  /** @returns {Promise<DomainOverview | null>} */
  async getOverview(_domain, _opts) { throw new Error('Not implemented'); }

  /** @returns {Promise<ComparisonRow[]>} keywords the competitor ranks for that the target domain doesn't (or ranks worse for) */
  async getKeywordGap(_yourDomain, _competitorDomain, _opts) { throw new Error('Not implemented'); }

  /** @returns {Promise<ComparisonRow[]>} content/page-level gaps, derived from ranked-keyword page groupings */
  async getContentGap(_yourDomain, _competitorDomain, _opts) { throw new Error('Not implemented'); }

  /** @returns {Promise<ComparisonRow[]>} referring domains the competitor has that the target domain doesn't */
  async getBacklinkGap(_yourDomain, _competitorDomain, _opts) { throw new Error('Not implemented'); }

  /** @returns {Promise<ComparisonRow[]>} pages the competitor has ranking pages for that the target domain has no equivalent for */
  async getPageGap(_yourDomain, _competitorDomain, _opts) { throw new Error('Not implemented'); }
}

module.exports = CompetitorProviderInterface;
