function toAnalyticsResponseDto(dashboard) {
  return {
    meta: dashboard.meta,
    metrics: dashboard.metrics,
    websiteTraffic: dashboard.websiteTraffic,
    searchTraffic: dashboard.searchTraffic,
    topSearchQueries: dashboard.topSearchQueries,
    topSearchPages: dashboard.topSearchPages,
    leadsByChannel: dashboard.leadsByChannel,
    channelBreakdown: dashboard.channelBreakdown,
    topLandingPages: dashboard.topLandingPages,
    topChannels: dashboard.topChannels,
    topDevices: dashboard.topDevices,
    topCountries: dashboard.topCountries,
    topReferrers: dashboard.topReferrers,
    gscInsights: dashboard.gscInsights,
    gscPerformance: dashboard.gscPerformance
  };
}

module.exports = { toAnalyticsResponseDto };