/**
 * AI Core Analyzers — analyzerPipeline
 *
 * Single entry point that orchestrates the full analyzer chain (architecture
 * plan §4), with parallel execution wherever dependencies allow:
 *
 *   Stage 1 (parallel): CrawlAnalyzer(siteUrl)  +  PerformanceAnalyzer(siteUrl)
 *   Stage 2 (parallel, needs Stage 1's pages[]):
 *     MetaAnalyzer, HeadingAnalyzer, ImageAnalyzer, SchemaAnalyzer,
 *     ContentAnalyzer, LinkAnalyzer
 *   Stage 3: ScoreCalculator, once everything above has finished
 *
 * Every analyzer already degrades to a well-formed AnalyzerResult on failure
 * (see `contracts/analyzerResult.contract.js`), so a single analyzer
 * erroring never aborts the whole run — ScoreCalculator simply excludes
 * whatever has no score (see its own `warnings`).
 *
 * Pure computation — writes nothing to the database (architecture plan §5).
 */
const { runParallel } = require('../execution/parallelExecutor');
const { PAGE_BASED_ANALYZER_KEYS } = require('../execution/analyzerExecutionPlan');
const { nowIso, durationMs } = require('../utils/timing.util');
const logger = require('../logger.service');

const crawlAnalyzer = require('./crawlAnalyzer');
const metaAnalyzer = require('./metaAnalyzer');
const headingAnalyzer = require('./headingAnalyzer');
const linkAnalyzer = require('./linkAnalyzer');
const imageAnalyzer = require('./imageAnalyzer');
const schemaAnalyzer = require('./schemaAnalyzer');
const performanceAnalyzer = require('./performanceAnalyzer');
const contentAnalyzer = require('./contentAnalyzer');
const scoreCalculator = require('./scoreCalculator');

const PAGE_BASED_ANALYZERS = {
  meta: metaAnalyzer,
  heading: headingAnalyzer,
  image: imageAnalyzer,
  schema: schemaAnalyzer,
  content: contentAnalyzer,
  link: linkAnalyzer
};

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {number} [options.crawlLimit=50] - passed through to CrawlAnalyzer
 * @param {number} [options.concurrency=Infinity] - max analyzers running at once per stage
 * @param {Object} [options.weights] - override ScoreCalculator.DEFAULT_WEIGHTS
 * @returns {Promise<import('../types/analyzer.types').AnalyzerPipelineResult>}
 */
async function run(siteUrl, options = {}) {
  const pipelineStartedAt = nowIso();
  logger.info('AnalyzerPipeline', `Starting analyzer pipeline for ${siteUrl}`);

  // ── Stage 1: crawl + performance run in parallel — performance only needs siteUrl ──
  const stage1 = await runParallel(
    {
      crawl: () => crawlAnalyzer.run(siteUrl, { limit: options.crawlLimit }),
      performance: () => performanceAnalyzer.run(siteUrl, options.performanceOptions)
    },
    { concurrency: 2 }
  );

  const crawlResult = stage1.crawl.status === 'fulfilled'
    ? stage1.crawl.value
    : degradedResult('CrawlAnalyzer', stage1.crawl.reason);
  const performanceResult = stage1.performance.status === 'fulfilled'
    ? stage1.performance.value
    : degradedResult('PerformanceAnalyzer', stage1.performance.reason);

  const pages = crawlResult.raw?.pages || [];

  // ── Stage 2: every page-based analyzer runs in parallel off the same pages[] ──
  const stage2Tasks = {};
  PAGE_BASED_ANALYZER_KEYS.forEach((key) => {
    const analyzer = PAGE_BASED_ANALYZERS[key];
    stage2Tasks[key] = key === 'link'
      ? () => analyzer.run(pages, { siteUrl })
      : () => analyzer.run(pages);
  });

  const stage2 = await runParallel(stage2Tasks, { concurrency: options.concurrency || Infinity });

  const analyzerResults = { performance: performanceResult };
  PAGE_BASED_ANALYZER_KEYS.forEach((key) => {
    analyzerResults[key] = stage2[key].status === 'fulfilled'
      ? stage2[key].value
      : degradedResult(PAGE_BASED_ANALYZERS[key].NAME, stage2[key].reason);
  });

  // ── Stage 3: ScoreCalculator only runs once every analyzer above has settled ──
  const scoreResult = scoreCalculator.run(analyzerResults, options.weights);

  const finishedAt = nowIso();

  logger.info('AnalyzerPipeline', `Finished analyzer pipeline for ${siteUrl}`, {
    overall: scoreResult.score,
    durationMs: durationMs(pipelineStartedAt, finishedAt)
  });

  return {
    siteUrl,
    startedAt: pipelineStartedAt,
    finishedAt,
    duration: durationMs(pipelineStartedAt, finishedAt),
    analyzers: { crawl: crawlResult, ...analyzerResults },
    score: scoreResult
  };
}

/**
 * Builds a minimal, contract-shaped degraded result for a stage that
 * rejected outright (a bug outside `withAnalyzerContract`'s try/catch, e.g.
 * a synchronous throw before the wrapper is entered) — belt-and-suspenders
 * so `analyzerPipeline.run()` itself never throws because one stage did.
 */
function degradedResult(analyzerName, error) {
  const timestamp = nowIso();
  return {
    analyzer: analyzerName,
    version: 'unknown',
    startedAt: timestamp,
    finishedAt: timestamp,
    duration: 0,
    source: 'unavailable',
    score: analyzerName === 'CrawlAnalyzer' ? null : 0,
    findings: [{
      severity: 'error',
      category: 'analyzer_failure',
      message: `${analyzerName} failed unexpectedly: ${error?.message || 'unknown error'}`,
      pageUrl: null
    }],
    metrics: {},
    warnings: [error?.message || 'unknown error'],
    recommendations: [],
    raw: analyzerName === 'CrawlAnalyzer' ? { pages: [], summary: null } : null,
    metadata: { failed: true }
  };
}

module.exports = { run };
