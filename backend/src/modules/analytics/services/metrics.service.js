/**
 * Analytics Engine — metrics/calculation service.
 *
 * This is the single place that combines the real data sources (GA4, Search
 * Console, CRM leads/invoices, Performance Ads) into the metrics the
 * Analytics & Attribution dashboard needs. Every number returned is either
 * pulled straight from one of those sources, or a deterministic derivation
 * of them (trend %, CTR, conversion rate, returning users, weighted
 * averages). Nothing here is randomized, hardcoded, or a placeholder.
 */
const ga4 = require('../sources/googleAnalytics.source');
const gsc = require('../sources/searchConsole.source');
const crm = require('../sources/crm.source');
const PerformanceAd = require('../../performanceAds/performanceAds.model');
const { resolveScope } = require('./clientScope.service');
const { resolveDateRange } = require('../utils/dateRange');
const { trendPercent, toPercent, round, formatCurrencyLakhs } = require('../utils/calculations');
const { normalizeChannel } = require('../utils/channelBucket');

/** Sums a list of overview-metric objects returned by ga4.getOverviewMetrics. */
function sumOverviews(overviews) {
  const connectedOnes = overviews.filter(o => o.connected);
  const base = { sessions: 0, totalUsers: 0, newUsers: 0, conversions: 0 };
  // Bounce/engagement rate are weighted by sessions so combining multiple
  // GA4 properties doesn't just naively average two very different traffic volumes.
  let bounceWeighted = 0;
  let engagementWeighted = 0;

  for (const o of connectedOnes) {
    base.sessions += o.sessions;
    base.totalUsers += o.totalUsers;
    base.newUsers += o.newUsers;
    base.conversions += o.conversions;
    bounceWeighted += o.bounceRate * o.sessions;
    engagementWeighted += o.engagementRate * o.sessions;
  }

  return {
    connected: connectedOnes.length > 0,
    connectedCount: connectedOnes.length,
    sessions: base.sessions,
    totalUsers: base.totalUsers,
    newUsers: base.newUsers,
    returningUsers: Math.max(base.totalUsers - base.newUsers, 0),
    conversions: base.conversions,
    bounceRate: base.sessions > 0 ? bounceWeighted / base.sessions : 0,
    engagementRate: base.sessions > 0 ? engagementWeighted / base.sessions : 0
  };
}

function sumSearchTotals(totals) {
  const connectedOnes = totals.filter(t => t.connected);
  const clicks = connectedOnes.reduce((s, t) => s + t.clicks, 0);
  const impressions = connectedOnes.reduce((s, t) => s + t.impressions, 0);
  const positionWeighted = connectedOnes.reduce((s, t) => s + t.position * t.impressions, 0);

  return {
    connected: connectedOnes.length > 0,
    connectedCount: connectedOnes.length,
    clicks,
    impressions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    position: impressions > 0 ? positionWeighted / impressions : 0
  };
}

/** Merges breakdown row arrays (from multiple client GA4 properties) by dimension key, summing sessions. */
function mergeBreakdownRows(rowArrays, limit = 10) {
  const merged = new Map();
  for (const rows of rowArrays) {
    for (const row of rows) {
      const key = row.dimension;
      if (!merged.has(key)) {
        merged.set(key, { dimension: key, sessions: 0, sessionWeightedBounce: 0, sessionWeightedEngagement: 0 });
      }
      const acc = merged.get(key);
      acc.sessions += row.sessions;
      acc.sessionWeightedBounce += row.bounceRate * row.sessions;
      acc.sessionWeightedEngagement += row.engagementRate * row.sessions;
    }
  }

  return Array.from(merged.values())
    .map(r => ({
      dimension: r.dimension,
      sessions: round(r.sessions),
      bounceRate: r.sessions > 0 ? round(r.sessionWeightedBounce / r.sessions, 1) : 0,
      engagementRate: r.sessions > 0 ? round(r.sessionWeightedEngagement / r.sessions, 1) : 0
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

function mergeDailyTraffic(dayArrays) {
  const merged = new Map();
  for (const days of dayArrays) {
    for (const d of days) {
      if (!merged.has(d.day)) merged.set(d.day, { day: d.day, organic: 0, paid: 0, direct: 0, referral: 0 });
      const acc = merged.get(d.day);
      acc.organic += d.organic;
      acc.paid += d.paid;
      acc.direct += d.direct;
      acc.referral += d.referral;
    }
  }
  return Array.from(merged.values());
}

/**
 * Builds the full Analytics & Attribution dashboard payload for an agency,
 * optionally scoped to a single client, over a given date range.
 */
async function buildAnalyticsDashboard({ agencyId, clientId, rawDateRange }) {
  const range = resolveDateRange(rawDateRange);
  const { scope, clients } = await resolveScope({ agencyId, clientId });

  const ga4Clients = clients.filter(c => c.ga4PropertyId);
  const gscClients = clients.filter(c => c.gscSiteUrl);

  const [
    currentOverviews,
    previousOverviews,
    currentSearchTotals,
    previousSearchTotals,
    channelRowsPerClient,
    deviceRowsPerClient,
    countryRowsPerClient,
    referrerRowsPerClient,
    landingPageRowsPerClient,
    dailyTrafficPerClient,
    leadMetrics,
    previousLeadMetrics,
    revenueMetrics,
    previousRevenueMetrics,
    performanceAd
  ] = await Promise.all([
    Promise.all(ga4Clients.map(c => ga4.getOverviewMetrics(c.ga4PropertyId, range.ga4Start, range.ga4End))),
    Promise.all(ga4Clients.map(c => ga4.getOverviewMetrics(c.ga4PropertyId, range.previousGa4Start, range.previousGa4End))),
    Promise.all(gscClients.map(c => gsc.getSearchTotals(c.gscSiteUrl, range.ga4Start, range.ga4End))),
    Promise.all(gscClients.map(c => gsc.getSearchTotals(c.gscSiteUrl, range.previousGa4Start, range.previousGa4End))),
    Promise.all(ga4Clients.map(c => ga4.getBreakdown(c.ga4PropertyId, 'sessionSourceMedium', range.ga4Start, range.ga4End, 20))),
    Promise.all(ga4Clients.map(c => ga4.getBreakdown(c.ga4PropertyId, 'deviceCategory', range.ga4Start, range.ga4End, 10))),
    Promise.all(ga4Clients.map(c => ga4.getBreakdown(c.ga4PropertyId, 'country', range.ga4Start, range.ga4End, 10))),
    Promise.all(ga4Clients.map(c => ga4.getBreakdown(c.ga4PropertyId, 'sessionSource', range.ga4Start, range.ga4End, 15))),
    Promise.all(ga4Clients.map(c => ga4.getBreakdown(c.ga4PropertyId, 'pagePath', range.ga4Start, range.ga4End, 10))),
    Promise.all(ga4Clients.map(c => ga4.getDailyTrafficBySourceBucket(c.ga4PropertyId, range.ga4Start, range.ga4End))),
    crm.getLeadMetrics({ companyId: agencyId, clientId: scope === 'single' ? clientId : null, start: range.start, end: range.endExclusive }),
    crm.getLeadMetrics({ companyId: agencyId, clientId: scope === 'single' ? clientId : null, start: range.previousStart, end: range.previousEndExclusive }),
    crm.getRevenueMetrics({ agencyId, clientId: scope === 'single' ? clientId : null, start: range.start, end: range.endExclusive }),
    crm.getRevenueMetrics({ agencyId, clientId: scope === 'single' ? clientId : null, start: range.previousStart, end: range.previousEndExclusive }),
    PerformanceAd.findOne({ agency: agencyId }).select('metrics')
  ]);

  const current = sumOverviews(currentOverviews);
  const previous = sumOverviews(previousOverviews);
  const currentSearch = sumSearchTotals(currentSearchTotals);
  const previousSearch = sumSearchTotals(previousSearchTotals);

  const organicSessions = mergeBreakdownRows(channelRowsPerClient, 100)
    .filter(r => normalizeChannel(r.dimension) === 'Organic Search')
    .reduce((s, r) => s + r.sessions, 0);

  const conversionRate = current.sessions > 0 ? (leadMetrics.totalLeads / current.sessions) * 100 : 0;
  const previousConversionRate = previous.sessions > 0 ? (previousLeadMetrics.totalLeads / previous.sessions) * 100 : 0;

  // Channel breakdown: merges GA4 session volume with CRM lead volume on the
  // same normalized channel key. This is the honest, last-touch-by-source
  // view the data actually supports — not a fabricated multi-touch model.
  const channelSessions = new Map();
  for (const row of mergeBreakdownRows(channelRowsPerClient, 100)) {
    const bucket = normalizeChannel(row.dimension);
    channelSessions.set(bucket, (channelSessions.get(bucket) || 0) + row.sessions);
  }
  const channelLeads = new Map();
  for (const row of leadMetrics.leadsByChannel) {
    channelLeads.set(row.channel, (channelLeads.get(row.channel) || 0) + row.leads);
  }
  const allChannelKeys = new Set([...channelSessions.keys(), ...channelLeads.keys()]);
  const channelBreakdown = Array.from(allChannelKeys).map(channel => {
    const sessions = channelSessions.get(channel) || 0;
    const leads = channelLeads.get(channel) || 0;
    return {
      channel,
      sessions,
      leads,
      conversionRate: sessions > 0 ? toPercent((leads / sessions) * 100) : '—'
    };
  }).sort((a, b) => b.sessions - a.sessions);

  const metrics = {
    sessions: round(current.sessions),
    sessionsTrend: trendPercent(current.sessions, previous.sessions),

    users: round(current.totalUsers),
    usersTrend: trendPercent(current.totalUsers, previous.totalUsers),

    newUsers: round(current.newUsers),
    newUsersTrend: trendPercent(current.newUsers, previous.newUsers),

    returningUsers: round(current.returningUsers),
    returningUsersTrend: trendPercent(current.returningUsers, previous.returningUsers),

    organicSessions: round(organicSessions),
    organicTrafficShare: current.sessions > 0 ? toPercent((organicSessions / current.sessions) * 100) : '0%',

    clicks: round(currentSearch.clicks),
    clicksTrend: trendPercent(currentSearch.clicks, previousSearch.clicks),

    impressions: round(currentSearch.impressions),
    impressionsTrend: trendPercent(currentSearch.impressions, previousSearch.impressions),

    ctr: toPercent(currentSearch.ctr, 2),
    ctrTrend: trendPercent(currentSearch.ctr, previousSearch.ctr),

    averagePosition: round(currentSearch.position, 1),
    averagePositionTrend: trendPercent(previousSearch.position, currentSearch.position), // lower position number = better, so trend direction is flipped

    bounceRate: toPercent(current.bounceRate),
    bounceRateTrend: trendPercent(previous.bounceRate, current.bounceRate), // lower bounce = better

    engagementRate: toPercent(current.engagementRate),
    engagementRateTrend: trendPercent(current.engagementRate, previous.engagementRate),

    conversions: round(current.conversions),
    conversionsTrend: trendPercent(current.conversions, previous.conversions),

    leads: leadMetrics.totalLeads,
    leadsTrend: trendPercent(leadMetrics.totalLeads, previousLeadMetrics.totalLeads),

    revenue: round(revenueMetrics.revenue),
    revenueFormatted: formatCurrencyLakhs(revenueMetrics.revenue),
    revenueTrend: trendPercent(revenueMetrics.revenue, previousRevenueMetrics.revenue),

    conversionRate: toPercent(conversionRate),
    conversionRateTrend: trendPercent(conversionRate, previousConversionRate),

    totalAdSpend: formatCurrencyLakhs(performanceAd?.metrics?.adSpendMTD || 0),
    blendedRoas: `${round(performanceAd?.metrics?.roas || 0, 1)}x`
  };

  return {
    meta: {
      agencyId: String(agencyId),
      clientId: scope === 'single' ? String(clientId) : null,
      scope,
      dateRange: { start: range.ga4Start, end: range.ga4End },
      previousDateRange: { start: range.previousGa4Start, end: range.previousGa4End },
      generatedAt: new Date().toISOString(),
      connections: {
        ga4: { connectedClients: current.connectedCount, configuredClients: ga4Clients.length, totalClients: clients.length },
        gsc: { connectedClients: currentSearch.connectedCount, configuredClients: gscClients.length, totalClients: clients.length }
      }
    },
    metrics,
    websiteTraffic: mergeDailyTraffic(dailyTrafficPerClient),
    leadsByChannel: leadMetrics.leadsByChannel,
    channelBreakdown,
    topLandingPages: mergeBreakdownRows(landingPageRowsPerClient, 10).map(r => ({
      path: r.dimension,
      sessions: r.sessions,
      bounceRate: toPercent(r.bounceRate),
      engagementRate: toPercent(r.engagementRate)
    })),
    topChannels: mergeBreakdownRows(channelRowsPerClient, 10).map(r => ({ channel: r.dimension, sessions: r.sessions })),
    topDevices: mergeBreakdownRows(deviceRowsPerClient, 10).map(r => ({ device: r.dimension, sessions: r.sessions })),
    topCountries: mergeBreakdownRows(countryRowsPerClient, 10).map(r => ({ country: r.dimension, sessions: r.sessions })),
    topReferrers: mergeBreakdownRows(referrerRowsPerClient, 10)
      .filter(r => !['(direct)', 'google', '(not set)'].includes((r.dimension || '').toLowerCase()))
      .map(r => ({ referrer: r.dimension, sessions: r.sessions }))
  };
}

module.exports = { buildAnalyticsDashboard };
