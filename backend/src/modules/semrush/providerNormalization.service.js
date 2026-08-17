class ProviderNormalizationService {
  normalizeSemrushOverview(overviewData) {
    if (!overviewData || overviewData.length === 0 || overviewData[0].isFallback) {
      return {
        organicTraffic: this.createUnavailableMetric('semrush'),
        organicKeywords: this.createUnavailableMetric('semrush')
      };
    }

    const data = overviewData[0];
    const traffic = Number(data['Organic Traffic'] || data.Ot || 0);
    const keywords = Number(data['Organic Keywords'] || data.Or || 0);

    return {
      organicTraffic: this.createMetric(traffic, 'semrush', true, 20),
      organicKeywords: this.createMetric(keywords, 'semrush', true, 10)
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
    const totalBacklinks = Number(data.total || 0);
    const score = Number(data.score || 0);

    return {
      backlinks: this.createMetric(totalBacklinks, 'semrush', true, 15),
      authorityScore: this.createMetric(score, 'semrush', true, 25)
    };
  }

  normalizeSemrushSiteHealth(siteHealthData) {
    if (!siteHealthData || siteHealthData.status === 'unavailable' || siteHealthData.overallScore === null) {
      return {
        technicalScore: this.createUnavailableMetric('semrush')
      };
    }

    return {
      technicalScore: this.createMetric(siteHealthData.overallScore, 'semrush', true, 25)
    };
  }

  normalizeCrawlerData(crawledPages) {
    if (!crawledPages || crawledPages.length === 0) {
      return {
        status: 'unavailable',
        eeatSignals: this.createUnavailableMetric('crawler'),
        schemaUsage: this.createUnavailableMetric('crawler'),
        contentCompleteness: this.createUnavailableMetric('crawler')
      };
    }

    let totalSchema = 0;
    let totalH1 = 0;
    
    crawledPages.forEach(page => {
      totalSchema += page.schemaCount || 0;
      totalH1 += (page.h1Count > 0 ? 1 : 0);
    });

    const schemaCoverage = Math.min(100, Math.round((totalSchema / crawledPages.length) * 100));
    const h1Coverage = Math.min(100, Math.round((totalH1 / crawledPages.length) * 100));

    return {
      status: 'available',
      schemaUsage: this.createMetric(schemaCoverage, 'crawler', true, 15),
      contentCompleteness: this.createMetric(h1Coverage, 'crawler', true, 15)
    };
  }

  normalizePageSpeedData(pageSpeedData) {
    if (!pageSpeedData || pageSpeedData.status === 'unavailable') {
      return {
        coreWebVitals: this.createUnavailableMetric('pagespeed')
      };
    }
    
    // Assuming pageSpeedData returns a score out of 100
    const score = Number(pageSpeedData.score || 0);
    return {
      coreWebVitals: this.createMetric(score, 'pagespeed', true, 15)
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
