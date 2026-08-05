/**
 * Shapes the Analytics Engine's internal result into the stable response
 * contract consumed by the frontend. Keeping this as its own layer means
 * the internal engine shape (metrics.service.js) can evolve without
 * every consumer of the API needing to change in lockstep.
 */
function toAnalyticsResponseDto(dashboard) {
  return {
    meta: dashboard.meta,
    metrics: dashboard.metrics,
    websiteTraffic: dashboard.websiteTraffic,
    leadsByChannel: dashboard.leadsByChannel,
    channelBreakdown: dashboard.channelBreakdown,
    topLandingPages: dashboard.topLandingPages,
    topChannels: dashboard.topChannels,
    topDevices: dashboard.topDevices,
    topCountries: dashboard.topCountries,
    topReferrers: dashboard.topReferrers
  };
}

module.exports = { toAnalyticsResponseDto };
