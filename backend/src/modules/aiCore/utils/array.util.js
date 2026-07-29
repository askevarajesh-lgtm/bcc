/**
 * AI Core — Array/collection utilities
 */

function chunk(items, size) {
  if (!size || size <= 0) return [items];
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = { chunk, safeArray };
