const { FunnelAnalytics, FunnelEvent } = require('./funnel.model');

class FunnelAnalyticsService {
  async trackEvent(funnelId, stepId, eventType, metadata = {}) {
    const event = new FunnelEvent({
      funnelId,
      stepId,
      eventType,
      metadata
    });
    await event.save();
    return event;
  }

  async getAnalytics(funnelId) {
    let analytics = await FunnelAnalytics.findOne({ funnelId });
    if (!analytics) {
      analytics = new FunnelAnalytics({ funnelId });
      await analytics.save();
    }
    
    // In a real scenario, this would aggregate from events or visits
    return analytics;
  }
}

module.exports = new FunnelAnalyticsService();
