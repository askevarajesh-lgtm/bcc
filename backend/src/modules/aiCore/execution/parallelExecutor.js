/**
 * AI Core — Parallel Executor
 *
 * Runs a map of independent async tasks concurrently. Used by
 * `analyzers/analyzerPipeline.js` to fan out MetaAnalyzer/HeadingAnalyzer/
 * ImageAnalyzer/SchemaAnalyzer/ContentAnalyzer/LinkAnalyzer once
 * CrawlAnalyzer has produced `pages[]`, and to run PerformanceAnalyzer
 * concurrently with that group since it only depends on `siteUrl`.
 *
 * Each analyzer already returns a well-formed AnalyzerResult even on
 * internal failure (`contracts/analyzerResult.contract.js`'s
 * `withAnalyzerContract`), so this executor doesn't need its own
 * try/catch-and-degrade logic — it just needs to not let one task's promise
 * rejection (a bug outside the contract wrapper, e.g. a thrown TypeError
 * before `withAnalyzerContract` is reached) stop the others from finishing.
 * `Promise.allSettled` semantics are used throughout for that reason.
 *
 * In-process only, matching the rest of aiCore (no queue/worker
 * infrastructure exists in this codebase — see `retry.service.js`'s note).
 */
const logger = require('../logger.service');

/**
 * @param {Object.<string, () => Promise<*>>} taskMap - key -> async function (no args, already bound to its inputs)
 * @param {Object} [options]
 * @param {number} [options.concurrency=Infinity] - max tasks running at once; Infinity runs everything at once
 * @returns {Promise<Object.<string, { status: 'fulfilled'|'rejected', value?: *, reason?: Error }>>}
 */
async function runParallel(taskMap, options = {}) {
  const { concurrency = Infinity } = options;
  const entries = Object.entries(taskMap || {});
  const results = {};

  if (entries.length === 0) return results;

  const effectiveConcurrency = Math.max(1, Math.min(concurrency, entries.length));
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++;
      const [key, task] = entries[index];
      try {
        const value = await task();
        results[key] = { status: 'fulfilled', value };
      } catch (error) {
        logger.error('ParallelExecutor', `Task "${key}" rejected: ${error.message}`, { key });
        results[key] = { status: 'rejected', reason: error };
      }
    }
  }

  await Promise.all(Array.from({ length: effectiveConcurrency }, worker));
  return results;
}

/**
 * Convenience helper: like runParallel, but returns just the fulfilled
 * values keyed by task name, substituting `fallback` for any task that
 * rejected outright (so callers building an AnalyzerPipelineResult never
 * have to null-check).
 *
 * @param {Object.<string, () => Promise<*>>} taskMap
 * @param {*} fallback
 * @param {Object} [options]
 */
async function runParallelWithFallback(taskMap, fallback, options = {}) {
  const settled = await runParallel(taskMap, options);
  const out = {};
  Object.entries(settled).forEach(([key, entry]) => {
    out[key] = entry.status === 'fulfilled' ? entry.value : fallback;
  });
  return out;
}

module.exports = { runParallel, runParallelWithFallback };
