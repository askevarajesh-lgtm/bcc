/**
 * Google Analytics 4 data source for the Analytics & Attribution engine.
 *
 * Every method here either returns real numbers pulled from the GA4 Data API
 * for a configured `propertyId`, or an explicit "not connected" / zeroed
 * result with `connected: false`. Nothing in this file invents traffic
 * numbers — if a property isn't configured, or the API call fails, the
 * caller is told so and can render an honest "not connected" state instead
 * of a fake metric.
 */
const path = require('path');
const fs = require('fs');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

let cachedClient = null;
let credentialsResolved = false;

function getClient() {
  if (credentialsResolved) return cachedClient;
  credentialsResolved = true;

  const envPath = process.env.GA4_CREDENTIALS;
  if (!envPath) {
    cachedClient = null;
    return null;
  }

  const resolvedPath = path.resolve(process.cwd(), envPath);
  if (!fs.existsSync(resolvedPath)) {
    cachedClient = null;
    return null;
  }

  cachedClient = new BetaAnalyticsDataClient({ keyFilename: resolvedPath });
  return cachedClient;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Aggregate overview metrics for a single property + date range.
 * Sessions, Users, New Users, Bounce Rate, Engagement Rate, Conversions.
 * Returning Users is derived (totalUsers - newUsers) by the metrics service,
 * not fabricated here.
 */
async function getOverviewMetrics(propertyId, startDate, endDate) {
  const client = getClient();
  if (!client || !propertyId) {
    return { connected: false, sessions: 0, totalUsers: 0, newUsers: 0, bounceRate: 0, engagementRate: 0, conversions: 0 };
  }

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'conversions' }
      ]
    });

    const row = response.rows && response.rows[0];
    if (!row) {
      return { connected: true, sessions: 0, totalUsers: 0, newUsers: 0, bounceRate: 0, engagementRate: 0, conversions: 0 };
    }

    const [sessions, totalUsers, newUsers, bounceRate, engagementRate, conversions] = row.metricValues.map(m => num(m.value));

    return {
      connected: true,
      sessions,
      totalUsers,
      newUsers,
      bounceRate: bounceRate * 100,
      engagementRate: engagementRate * 100,
      conversions
    };
  } catch (error) {
    console.error(`[Analytics][GA4] Overview report failed for property ${propertyId}:`, error.message);
    return { connected: false, error: error.message, sessions: 0, totalUsers: 0, newUsers: 0, bounceRate: 0, engagementRate: 0, conversions: 0 };
  }
}

/**
 * Breakdown by a single GA4 dimension (sessionSourceMedium, deviceCategory,
 * country, sessionSource, pagePath...), sorted by sessions desc.
 */
async function getBreakdown(propertyId, dimensionName, startDate, endDate, limit = 10) {
  const client = getClient();
  if (!client || !propertyId) return { connected: false, rows: [] };

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: dimensionName }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit
    });

    const rows = (response.rows || []).map(r => ({
      dimension: r.dimensionValues[0].value,
      sessions: num(r.metricValues[0].value),
      bounceRate: num(r.metricValues[1].value) * 100,
      engagementRate: num(r.metricValues[2].value) * 100,
      avgSessionDuration: num(r.metricValues[3].value)
    }));

    return { connected: true, rows };
  } catch (error) {
    console.error(`[Analytics][GA4] Breakdown(${dimensionName}) failed for property ${propertyId}:`, error.message);
    return { connected: false, error: error.message, rows: [] };
  }
}

/**
 * Daily sessions split by traffic-source bucket, for the traffic-over-time
 * chart. Uses ['date', 'sessionSourceMedium'] and buckets the medium into
 * organic / paid / direct / referral using real GA4 source/medium values.
 */
async function getDailyTrafficBySourceBucket(propertyId, startDate, endDate) {
  const client = getClient();
  if (!client || !propertyId) return { connected: false, days: [] };

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 10000
    });

    const byDate = new Map();
    for (const r of (response.rows || [])) {
      const date = r.dimensionValues[0].value; // YYYYMMDD
      const sourceMedium = (r.dimensionValues[1].value || '').toLowerCase();
      const sessions = num(r.metricValues[0].value);

      if (!byDate.has(date)) byDate.set(date, { day: date, organic: 0, paid: 0, direct: 0, referral: 0 });
      const bucket = byDate.get(date);

      if (sourceMedium.includes('organic')) bucket.organic += sessions;
      else if (sourceMedium.includes('cpc') || sourceMedium.includes('ppc') || sourceMedium.includes('paid') || sourceMedium.includes('display')) bucket.paid += sessions;
      else if (sourceMedium.includes('(none)') || sourceMedium.includes('direct')) bucket.direct += sessions;
      else bucket.referral += sessions;
    }

    const days = Array.from(byDate.values()).sort((a, b) => a.day.localeCompare(b.day)).map(d => ({
      ...d,
      day: `${d.day.slice(4, 6)}/${d.day.slice(6, 8)}`
    }));

    return { connected: true, days };
  } catch (error) {
    console.error(`[Analytics][GA4] Daily traffic report failed for property ${propertyId}:`, error.message);
    return { connected: false, error: error.message, days: [] };
  }
}

module.exports = {
  getOverviewMetrics,
  getBreakdown,
  getDailyTrafficBySourceBucket
};
