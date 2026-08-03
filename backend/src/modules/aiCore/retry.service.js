/**
 * AI Core — Retry System
 *
 * A single generic retry-with-backoff wrapper, meant to be reused by the AI
 * Engine today and by the WordPress/GSC/GA4/crawl adapters proposed in
 * `marketplace-seo-platform-architecture.md` §1 later — none of those exist
 * yet, so nothing is being duplicated by adding this now.
 *
 * Contains no AI-specific or agent-specific logic — it just runs `fn` and
 * retries it on failure.
 */
const logger = require('./logger.service');

const DEFAULTS = {
  retries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  factor: 2,
  jitter: true,
  // By default, retry on anything. Callers can pass a predicate to only
  // retry on transient errors (e.g. network/5xx/rate-limit) and fail fast
  // on things like validation errors.
  retryIf: () => true,
  onRetry: null // (error, attempt) => void
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeDelay(attempt, options) {
  const raw = Math.min(options.maxDelayMs, options.baseDelayMs * Math.pow(options.factor, attempt));
  if (!options.jitter) return raw;
  // Full jitter: random value between 0 and raw, avoids retry storms.
  return Math.floor(Math.random() * raw);
}

/**
 * @param {Function} fn - async function to run. Receives the attempt number (0-indexed).
 * @param {Object} [options]
 * @returns {Promise<*>} whatever fn resolves with
 * @throws the last error if all retries are exhausted
 */
async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  let lastError;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === opts.retries;
      const shouldRetry = !isLastAttempt && opts.retryIf(error);

      if (!shouldRetry) {
        throw error;
      }

      const delay = computeDelay(attempt, opts);
      logger.warn('RetrySystem', `Attempt ${attempt + 1}/${opts.retries + 1} failed, retrying in ${delay}ms`, {
        error: error.message
      });
      if (typeof opts.onRetry === 'function') {
        try { opts.onRetry(error, attempt); } catch (_) { /* never let a hook break the retry loop */ }
      }
      await sleep(delay);
    }
  }

  throw lastError;
}

module.exports = { withRetry };
