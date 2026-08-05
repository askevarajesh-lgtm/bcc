/**
 * Caching layer for the Analytics engine.
 * Reuses the app's existing shared in-memory CacheProvider (already used by
 * the technicalSeo module) rather than inventing a second cache — per the
 * "reuse existing project infra" requirement. GA4/GSC calls are relatively
 * slow and rate-limited, so a short TTL cache keeps the dashboard snappy
 * without ever returning stale-for-too-long or synthetic data.
 */
const cache = require('../../technicalSeo/providers/CacheProvider');

const NAMESPACE = 'analytics';
const DEFAULT_TTL_SECONDS = 5 * 60; // 5 minutes — long enough to absorb repeat renders/tab switches, short enough to stay fresh

function buildKey({ agencyId, clientId, start, end }) {
  return `${NAMESPACE}:${agencyId}:${clientId || 'all'}:${start}:${end}`;
}

async function getOrCompute(keyParts, computeFn, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = buildKey(keyParts);
  const cached = await cache.get(key);
  if (cached) {
    return { ...cached, meta: { ...cached.meta, cache: { hit: true, ttlSeconds } } };
  }

  const fresh = await computeFn();
  const withCacheMeta = { ...fresh, meta: { ...fresh.meta, cache: { hit: false, ttlSeconds } } };
  await cache.set(key, withCacheMeta, ttlSeconds);
  return withCacheMeta;
}

async function invalidate({ agencyId, clientId, start, end }) {
  await cache.delete(buildKey({ agencyId, clientId, start, end }));
}

module.exports = { getOrCompute, invalidate, buildKey };
