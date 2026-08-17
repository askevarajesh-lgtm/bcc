class ProviderNormalizationService {
  normalizeSemrushOverview(raw) {
    if (!raw) return {};
    
    return {
      authorityScore: this.createMetric(raw.rank, 'semrush', true, 100),
      organicTraffic: this.createMetric(raw.organic_traffic, 'semrush', true, 100),
      organicKeywords: this.createMetric(raw.organic_keywords, 'semrush', true, 100),
      competitors: raw.competitors || [],
      trend: raw.trend || [],
      topKeywords: raw.topKeywords || [],
      positionDistribution: raw.positionDistribution || null,
      intentDistribution: raw.intentDistribution || [],
      organicKeywordsData: raw.organicKeywordsData || []
    };
  }

  normalizeSemrushBacklinks(raw) {
    if (!raw) return {};
    
    return {
      backlinks: this.createMetric(raw.total, 'semrush', true, 100),
      backlinksDetails: {
        referringDomains: raw.referring_domains,
        referringIps: raw.referring_ips,
        follow: raw.follow,
        nofollow: raw.nofollow,
        types: raw.types || {},
        anchors: raw.anchors || [],
        indexedPages: raw.indexedPages || []
      }
    };
  }

  normalizeSemrushSiteHealth(raw) {
    if (!raw) return {};
    const snapshot = raw.snapshot || raw;
    
    const extractIssueCounts = (issuesObj) => {
       if (!issuesObj) return [];
       return Object.entries(issuesObj).map(([id, count]) => ({ id, count }));
    };

    return {
      technicalScore: this.createMetric(snapshot.health_score || raw.healthScore, 'semrush', true, 100),
      siteHealthDetails: {
        snapshotId: snapshot.snapshot_id || raw.snapshotId,
        healthScore: snapshot.health_score || raw.healthScore,
        pagesCrawled: snapshot.pages_crawled || raw.pagesCrawled,
        healthy: snapshot.healthy || raw.healthy,
        broken: snapshot.broken || raw.broken,
        redirected: snapshot.redirected || raw.redirected,
        blocked: snapshot.blocked || raw.blocked,
        haveIssues: snapshot.have_issues || raw.haveIssues,
        errors: extractIssueCounts(snapshot.errors || raw.errors),
        warnings: extractIssueCounts(snapshot.warnings || raw.warnings),
        notices: extractIssueCounts(snapshot.notices || raw.notices),
        statusCodeGroups: snapshot.statusCodeGroups || raw.statusCodeGroups || {},
        sitemapStats: raw.sitemaps || {},
        crawlDepthStats: raw.depths || {},
        topIssues: snapshot.topIssues || raw.topIssues || [],
        topInsights: snapshot.topInsights || raw.topInsights || [],
        blockedPageStats: snapshot.blockedPageStats || raw.blockedPageStats || {},
        crawledPagesList: raw.crawledPagesList || [],
        fetchedAt: snapshot.finish_date ? new Date(snapshot.finish_date) : (raw.finish_date ? new Date(raw.finish_date) : new Date()),
        source: 'Semrush'
      }
    };
  }

  normalizeTrafficAnalytics(data) {
    if (!data || data.length === 0) {
      return { trafficAnalytics: null };
    }
    return { trafficAnalytics: data };
  }

  normalizePositionTracking(data) {
    if (!data) {
      return { positionTracking: null };
    }
    return { positionTracking: data };
  }

  createMetric(value, source, available, weight = 0, status = 'available') {
    return {
      value,
      source,
      measuredAt: new Date(),
      available,
      weight,
      status
    };
  }

  createUnavailableMetric(source, status = 'unavailable') {
    return {
      value: null,
      source,
      measuredAt: new Date(),
      available: false,
      weight: 0,
      status
    };
  }
}

module.exports = new ProviderNormalizationService();
