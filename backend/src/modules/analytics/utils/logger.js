/**
 * Minimal leveled logger for the Analytics & Attribution module.
 *
 * Every external data source (GA4, Search Console) fails independently and
 * on purpose falls back to a "not connected" result rather than throwing,
 * so those failures need to be visible somewhere without crashing the
 * request. This centralizes that logging behind one small surface so it's
 * easy to swap for a real log pipeline later without touching every call
 * site individually.
 */
const PREFIX = '[Analytics]';

function warn(tag, message, err) {
  const suffix = err?.message ? `: ${err.message}` : '';
  console.warn(`${PREFIX}[${tag}] ${message}${suffix}`);
}

function error(tag, message, err) {
  const suffix = err?.message ? `: ${err.message}` : '';
  console.error(`${PREFIX}[${tag}] ${message}${suffix}`);
}

module.exports = { warn, error };
