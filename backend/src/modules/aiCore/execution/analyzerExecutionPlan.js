/**
 * AI Core — Analyzer Execution Plan
 *
 * Describes the pipeline's dependency structure in one place (see
 * architecture plan §4 + the parallel-execution requirement):
 *
 *   Stage 1 (parallel): CrawlAnalyzer(siteUrl)  +  PerformanceAnalyzer(siteUrl)
 *   Stage 2 (parallel, depends on Stage 1's CrawlAnalyzer pages[]):
 *     MetaAnalyzer, HeadingAnalyzer, ImageAnalyzer, SchemaAnalyzer,
 *     ContentAnalyzer, LinkAnalyzer
 *   Stage 3 (depends on all of Stage 1 + Stage 2): ScoreCalculator
 *
 * This is metadata only — `analyzers/analyzerPipeline.js` is what actually
 * executes it via `execution/parallelExecutor.js`. Kept separate so the
 * shape of the DAG is documented/testable independent of the orchestration
 * code, and so a future stage (e.g. an AEO/GEO analyzer) can be added by
 * extending PAGE_BASED_ANALYZER_KEYS without touching the executor.
 */

/** Analyzer keys that only need siteUrl and run in Stage 1 alongside the crawl. */
const INDEPENDENT_ANALYZER_KEYS = ['performance'];

/** Analyzer keys that need `pages[]` from CrawlAnalyzer and run together in Stage 2. */
const PAGE_BASED_ANALYZER_KEYS = ['meta', 'heading', 'image', 'schema', 'content', 'link'];

/** All analyzer keys ScoreCalculator (Stage 3) can weight, in the order weights are documented. */
const ALL_SCORED_ANALYZER_KEYS = [...PAGE_BASED_ANALYZER_KEYS, ...INDEPENDENT_ANALYZER_KEYS];

module.exports = { INDEPENDENT_ANALYZER_KEYS, PAGE_BASED_ANALYZER_KEYS, ALL_SCORED_ANALYZER_KEYS };
