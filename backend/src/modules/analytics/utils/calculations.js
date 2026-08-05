/**
 * Centralized, pure calculation helpers for the Analytics engine.
 * No data fetching here — just deterministic math over numbers already
 * pulled from real sources, kept in one place so every metric is computed
 * the same way everywhere it's used.
 */

/** Percentage change between a current and previous value, as a signed string e.g. "+12.4%". */
function trendPercent(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c > 0 ? '+100%' : '0%';
  const change = ((c - p) / p) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/** Safe division returning 0 instead of NaN/Infinity. */
function safeDivide(numerator, denominator) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  return d > 0 ? n / d : 0;
}

function toPercent(value, decimals = 1) {
  return `${(Number(value) || 0).toFixed(decimals)}%`;
}

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function formatCurrencyLakhs(value) {
  const n = Number(value) || 0;
  return `₹${(n / 100000).toFixed(2)}L`;
}

module.exports = { trendPercent, safeDivide, toPercent, round, formatCurrencyLakhs };
