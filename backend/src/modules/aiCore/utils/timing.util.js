/**
 * AI Core — Timing utilities
 *
 * Single source of truth for how every analyzer/pipeline stage stamps
 * startedAt/finishedAt/duration, so the numbers in the standardized analyzer
 * contract are computed the same way everywhere.
 */

function nowIso() {
  return new Date().toISOString();
}

function durationMs(startedAtIso, finishedAtIso) {
  const start = new Date(startedAtIso).getTime();
  const end = new Date(finishedAtIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, end - start);
}

/**
 * Runs `fn`, returning { result, startedAt, finishedAt, duration } regardless
 * of whether fn resolves or throws (the caller decides what to do with a
 * thrown error — this only measures).
 */
async function withTiming(fn) {
  const startedAt = nowIso();
  try {
    const result = await fn();
    const finishedAt = nowIso();
    return { result, error: null, startedAt, finishedAt, duration: durationMs(startedAt, finishedAt) };
  } catch (error) {
    const finishedAt = nowIso();
    return { result: null, error, startedAt, finishedAt, duration: durationMs(startedAt, finishedAt) };
  }
}

module.exports = { nowIso, durationMs, withTiming };
