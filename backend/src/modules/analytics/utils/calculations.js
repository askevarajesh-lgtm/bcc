function trendPercent(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c > 0 ? '+100%' : '0%';
  const change = ((c - p) / p) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
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

module.exports = { trendPercent, toPercent, round, formatCurrencyLakhs };