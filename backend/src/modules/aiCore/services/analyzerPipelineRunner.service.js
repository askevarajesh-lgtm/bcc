/**
 * AI Core Services — Analyzer Pipeline Runner
 *
 * The reusable call-site for the analyzer pipeline, wired through the same
 * `executionQueue`/`logger.logExecution` pattern every existing agent
 * (`internalLinkingAgent`, `imageSeoAgent`, `schemaAgent`, ...) already uses.
 * This is what Phase 2 (architecture plan §6) will have agents call instead
 * of `analyzerPipeline.run()` directly — it's the "service" layer around the
 * pure "analyzers" computation layer:
 *
 *   agent -> services/analyzerPipelineRunner (queued, logged, cacheable)
 *         -> analyzers/analyzerPipeline (pure orchestration)
 *         -> analyzers/*Analyzer (pure computation)
 *
 * Still writes nothing to the database (architecture plan §5) — callers
 * that want to persist an AnalyzerPipelineResult do so themselves, the same
 * way `internalLinkingAgent.run()` persists its own `WorkspaceInternalLink`.
 */
const executionQueue = require('../executionQueue.service');
const logger = require('../logger.service');
const analyzerPipeline = require('../analyzers/analyzerPipeline');

const SOURCE = 'analyzerPipelineRunner';

/**
 * @param {string} siteUrl
 * @param {Object} [options] - forwarded to analyzerPipeline.run() (crawlLimit, concurrency, weights, performanceOptions)
 * @param {string} [options.queueKey] - defaults to siteUrl; pass a projectId to serialize runs per-project instead
 * @returns {Promise<import('../types/analyzer.types').AnalyzerPipelineResult>}
 */
async function runForSite(siteUrl, options = {}) {
  const queueKey = options.queueKey || `analyzer-pipeline:${siteUrl}`;
  const executionId = `analyzerPipeline:${siteUrl}:${Date.now()}`;
  const startedAt = Date.now();

  return executionQueue.run(queueKey, async () => {
    logger.logExecution({ executionId, source: SOURCE, status: 'started', meta: { siteUrl } });

    try {
      const pipelineResult = await analyzerPipeline.run(siteUrl, options);

      logger.logExecution({
        executionId,
        source: SOURCE,
        status: 'succeeded',
        durationMs: Date.now() - startedAt,
        meta: {
          siteUrl,
          overall: pipelineResult.score.score,
          pageCount: pipelineResult.analyzers.crawl?.metadata?.pageCount || 0
        }
      });

      return pipelineResult;
    } catch (error) {
      logger.logExecution({
        executionId, source: SOURCE, status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

module.exports = { runForSite };
