/**
 * AI Core — Analyzer type definitions (JSDoc only, no runtime behavior)
 *
 * The codebase is plain CommonJS/JS (see package.json — no TypeScript
 * toolchain), so these are JSDoc typedefs rather than .d.ts/.ts. They exist
 * so every analyzer/provider/pipeline file can `@param {AnalyzerResult}` etc.
 * and get editor autocomplete + a single documented shape to code against.
 *
 * @typedef {'critical'|'warning'|'info'|'error'} FindingSeverity
 *
 * @typedef {Object} Finding
 * @property {FindingSeverity} severity
 * @property {string} category
 * @property {string} message
 * @property {string|null} pageUrl
 *
 * @typedef {'crawl'|'psi'|'dataforseo'|'internal'|'unavailable'} AnalyzerSource
 *
 * @typedef {Object} AnalyzerResult
 * @property {string} analyzer            - analyzer name, e.g. 'MetaAnalyzer'
 * @property {string} version             - semver-ish string, e.g. '1.0.0'
 * @property {string} startedAt           - ISO 8601 timestamp
 * @property {string} finishedAt          - ISO 8601 timestamp
 * @property {number} duration            - ms, finishedAt - startedAt
 * @property {AnalyzerSource} source      - where the underlying data came from
 * @property {number|null} score          - 0-100, or null if not applicable (e.g. CrawlAnalyzer)
 * @property {Finding[]} findings         - page-level issues, same vocabulary as WorkspaceAudit findings
 * @property {Object} metrics             - analyzer-specific numeric/structured metrics
 * @property {string[]} warnings          - operational warnings (degraded data, timeouts, fallbacks used)
 * @property {(string|Object)[]} recommendations - human-readable suggestions, separate from raw findings
 * @property {*} raw                      - underlying provider payload, kept for debugging/reuse; may be null
 * @property {Object} metadata            - free-form context (page counts, options used, etc.)
 *
 * @typedef {Object} PageRecord
 * @property {string} url
 * @property {number} status
 * @property {string} final_url
 * @property {boolean} redirected
 * @property {string} title
 * @property {string} meta_description
 * @property {string} h1
 * @property {string} canonical
 * @property {string} meta_robots
 * @property {number} word_count
 * @property {boolean|null} indexable
 * @property {string} error
 * @property {string[]} links
 * @property {Object[]} images
 * @property {Object[]} headings
 * @property {number} listCount
 * @property {number} tableCount
 * @property {boolean} hasExistingFaqSchema
 * @property {Object[]} [jsonLd]
 *
 * @typedef {Object} AnalyzerPipelineResult
 * @property {string} siteUrl
 * @property {string} startedAt
 * @property {string} finishedAt
 * @property {number} duration
 * @property {Object.<string, AnalyzerResult>} analyzers - keyed by analyzer key (meta, heading, schema, link, image, content, performance)
 * @property {AnalyzerResult} score - ScoreCalculator's own result, whose `metrics.overall`/`metadata.breakdown` hold the aggregate
 */

module.exports = {};
