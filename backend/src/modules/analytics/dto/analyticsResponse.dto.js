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
    topReferrers: dashboard.topReferrers,
    attribution: dashboard.attribution,
    customerJourney: dashboard.customerJourney,
    seoIntelligence: dashboard.seoIntelligence,
    aiInsights: dashboard.aiInsights
  };
}

module.exports = { toAnalyticsResponseDto };