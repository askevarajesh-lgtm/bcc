class ProviderNormalizationService {
  normalizeSemrushOverview(raw) {
    if (!raw) return {};
    
    const data = Array.isArray(raw) ? raw[0] : raw;
    if (!data) return {};
    
    return {
      semrushRank: this.createMetric(data.Rk || data.Rank, 'semrush', true, 100),
      organicTraffic: this.createMetric(data.Ot || data['Organic Traffic'], 'semrush', true, 100),
      organicKeywords: this.createMetric(data.Or || data['Organic Keywords'], 'semrush', true, 100),
      paidTraffic: this.createMetric(data.At || data['Adwords Traffic'] || 0, 'semrush', true, 100),
      organicCost: this.createMetric(data.Oc || data['Organic Cost'] || 0, 'semrush', true, 100),
      competitors: data.competitors || [],
      trend: data.trend || [],
      topKeywords: data.topKeywords || [],
      positionDistribution: data.positionDistribution || null,
      intentDistribution: data.intentDistribution || [],
      organicKeywordsData: data.organicKeywordsData || [],
      serpFeatures: data.serpFeatures || null
    };
  }

  normalizeSemrushBacklinks(raw) {
    if (!raw) return {};
    
    const data = Array.isArray(raw) ? raw[0] : raw;
    if (!data) return {};
    
    return {
      authorityScore: this.createMetric(data.score, 'semrush', true, 100),
      backlinks: this.createMetric(data.total, 'semrush', true, 100),
      backlinksDetails: {
        referringDomains: data.domains_num,
        referringIps: data.ips_num,
        follow: data.follows_num,
        nofollow: data.nofollows_num,
        sponsored: data.sponsored_num,
        ugc: data.ugc_num,
        texts: data.texts_num,
        images: data.images_num,
        forms: data.forms_num,
        frames: data.frames_num,
        subnets: data.subnets_num,
        anchors: data.anchors || [],
        indexedPages: data.pages || [],
        refDomainsList: data.refDomains || [],
        asDistribution: data.asDistribution || [],
        tlds: data.tlds || [],
        geo: data.geo || [],
        rawBacklinks: data.rawBacklinks || []
      }
    };
  }

  normalizeSemrushSiteHealth(raw) {
    if (!raw) return {};
    const auditData = raw.rawData || raw;
    const snapshot = auditData.current_snapshot || auditData.snapshot || auditData;
    
    const extractIssueCounts = (issuesObj) => {
       if (!issuesObj) return [];
       // If it's a number (like 0), return empty
       if (typeof issuesObj === 'number') return [];
       // If it's an empty object, return empty
       if (typeof issuesObj === 'object' && !Array.isArray(issuesObj) && Object.keys(issuesObj).length === 0) return [];
       // If it's already an array (e.g. from Semrush or our DB), return it directly
       if (Array.isArray(issuesObj)) return issuesObj;
       return Object.entries(issuesObj).map(([id, count]) => ({ id, count }));
    };

    return {
      technicalScore: this.createMetric(raw.overallScore || snapshot.quality?.value || auditData.quality?.value || snapshot.health_score || auditData.health_score || auditData.score || 0, 'semrush', true, 100),
      siteHealthDetails: {
        snapshotId: snapshot.snapshot_id || auditData.snapshotId || auditData.id,
        healthScore: snapshot.health_score || auditData.healthScore || auditData.score || raw.overallScore || 0,
        pagesCrawled: snapshot.pages_crawled || auditData.pagesCrawled || ((auditData.healthy || 0) + (auditData.broken || 0) + (auditData.redirected || 0) + (auditData.blocked || 0)) || 0,
        healthy: snapshot.healthy || auditData.healthy,
        broken: snapshot.broken || auditData.broken,
        redirected: snapshot.redirected || auditData.redirected,
        blocked: snapshot.blocked || auditData.blocked,
        haveIssues: snapshot.have_issues || auditData.haveIssues,
        errors: extractIssueCounts(auditData.errorsObj || snapshot.errors || auditData.errors),
        warnings: extractIssueCounts(auditData.warningsObj || snapshot.warnings || auditData.warnings),
        notices: extractIssueCounts(auditData.noticesObj || snapshot.notices || auditData.notices),
        statusCodeGroups: snapshot.statusCodeGroups || auditData.statusCodeGroups || {},
        sitemapStats: auditData.sitemaps || {},
        crawlDepthStats: auditData.depths || {},
        topIssues: snapshot.topIssues || auditData.topIssues || [],
        topInsights: snapshot.topInsights || auditData.topInsights || [],
        blockedPageStats: snapshot.blockedPageStats || auditData.blockedPageStats || {},
        crawledPagesList: auditData.crawledPagesList || [],
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
