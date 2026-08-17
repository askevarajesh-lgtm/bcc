class ProviderNormalizationService {
  normalizeSemrushOverview(overviewData) {
    if (!overviewData || overviewData.length === 0 || overviewData[0].isFallback) {
      return {
        organicTraffic: this.createUnavailableMetric('semrush'),
        organicKeywords: this.createUnavailableMetric('semrush')
      };
    }

    const data = overviewData[0];
    const trafficRaw = data['Organic Traffic'] ?? data.Ot;
    const keywordsRaw = data['Organic Keywords'] ?? data.Or;

    return {
      organicTraffic: trafficRaw !== undefined && trafficRaw !== null ? this.createMetric(Number(trafficRaw), 'semrush', true, 20) : this.createUnavailableMetric('semrush'),
      organicKeywords: keywordsRaw !== undefined && keywordsRaw !== null ? this.createMetric(Number(keywordsRaw), 'semrush', true, 10) : this.createUnavailableMetric('semrush'),
      trend: data.trend || [],
      competitors: data.competitors || [],
      topKeywords: data.topKeywords || [],
      positionDistribution: data.positionDistribution || null,
      intentDistribution: data.intentDistribution || null,
      organicKeywordsData: data.organicKeywordsData || []
    };
  }

  normalizeSemrushBacklinks(backlinksData) {
    if (!backlinksData || backlinksData.length === 0 || backlinksData[0].isFallback) {
      return {
        backlinks: this.createUnavailableMetric('semrush'),
        authorityScore: this.createUnavailableMetric('semrush')
      };
    }

    const data = backlinksData[0];
    const backlinksRaw = data.total;
    const scoreRaw = data.score;

    return {
      backlinks: backlinksRaw !== undefined && backlinksRaw !== null ? this.createMetric(Number(backlinksRaw), 'semrush', true, 15) : this.createUnavailableMetric('semrush'),
      authorityScore: scoreRaw !== undefined && scoreRaw !== null ? this.createMetric(Number(scoreRaw), 'semrush', true, 25) : this.createUnavailableMetric('semrush'),
      backlinksDetails: {
        domains_num: data.domains_num,
        ips_num: data.ips_num,
        follows_num: data.follows_num,
        nofollows_num: data.nofollows_num,
        anchors: data.anchors || [],
        refDomains: data.refDomains || [],
        asDistribution: data.asDistribution || [],
        tlds: data.tlds || [],
        geo: data.geo || [],
        pages: data.pages || [],
        rawBacklinks: data.rawBacklinks || []
      }
    };
  }

  normalizeSemrushSiteHealth(siteHealthData) {
    if (!siteHealthData || siteHealthData.status === 'unavailable' || siteHealthData.overallScore === null || siteHealthData.overallScore === undefined) {
      return {
        technicalScore: this.createUnavailableMetric('semrush')
      };
    }

    return {
      technicalScore: this.createMetric(Number(siteHealthData.overallScore), 'semrush', true, 25)
    };
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
