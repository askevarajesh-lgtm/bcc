const axios = require('axios');
const SemrushCache = require('./semrushCache.model');

class SemrushService {
  constructor() {
    this.baseUrl = 'https://api.semrush.com';
  }

  /**
   * Helper to fetch data with caching
   * @param {string} queryKey Unique key for the cache
   * @param {Object} params Query parameters for the Semrush API
   * @param {string} [overrideBaseUrl] Optional URL to override the default baseUrl
   * @returns {Promise<Object>} The JSON data
   */
  async fetchWithCache(queryKey, params, overrideBaseUrl = null) {
    const apiKey = process.env.SEMRUSH_API_KEY;
    if (!apiKey) {
      throw new Error('SEMRUSH_API_KEY is not defined in environment variables');
    }

    try {
      // 1. Check cache
      const cachedResult = await SemrushCache.findOne({ queryKey });
      if (cachedResult) {
        console.log(`[Semrush] Cache HIT for key: ${queryKey}`);
        return cachedResult.data;
      }

      console.log(`[Semrush] Cache MISS for key: ${queryKey}, fetching from API...`);

      // 2. Fetch from Semrush
      const requestUrl = overrideBaseUrl || this.baseUrl;
      const response = await axios.get(requestUrl, {
        params: {
          key: apiKey,
          ...params
        }
      });

      // 3. Parse Semrush CSV response to JSON
      const parsedData = this.parseCSVToJSON(response.data);

      // 4. Save to cache
      await SemrushCache.create({
        queryKey,
        data: parsedData
      });

      return parsedData;
    } catch (error) {
      const errorMessage = error.response?.data ? error.response.data.toString() : error.message;
      console.error(`[Semrush] API Error for ${queryKey}:`, errorMessage);
      throw new Error(`Semrush API Error: ${errorMessage}`);
    }
  }

  cleanDomain(domain) {
    if (!domain) return '';
    let cleaned = domain.trim();
    cleaned = cleaned.replace(/^https?:\/\//, '');
    cleaned = cleaned.replace(/^www\./, '');
    cleaned = cleaned.split('/')[0];
    return cleaned;
  }

  /**
   * Semrush typically returns semicolon-separated values.
   * This parses the first row as headers, and subsequent rows as data.
   */
  parseCSVToJSON(csvString) {
    if (typeof csvString !== 'string') return csvString;
    
    // Semrush often returns an error message starting with "ERROR" if something goes wrong
    if (csvString.startsWith('ERROR')) {
        if (csvString.includes('ERROR 50 :: NOTHING FOUND')) {
            return [];
        }
        throw new Error(csvString);
    }

    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(';');
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(';');
      const obj = {};
      
      headers.forEach((header, index) => {
        // Clean header name (remove carriage returns, quotes, etc)
        const cleanHeader = header.replace(/["\r]/g, '');
        const val = currentLine[index] ? currentLine[index].replace(/["\r]/g, '') : '';
        obj[cleanHeader] = val;
      });
      
      results.push(obj);
    }

    return results;
  }

  async getDomainOverview(domain, database = 'us') {
    const cleanDomain = this.cleanDomain(domain);
    const queryKey = `domain_overview_${cleanDomain}_${database}`;
    const params = {
      type: 'domain_ranks',
      domain: cleanDomain,
      database: database,
      export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac'
    };
    const overviewData = await this.fetchWithCache(queryKey, params);
    
    // Fetch historical trend, top keywords, and competitors in parallel
    if (overviewData && overviewData.length > 0) {
        const trendParams = {
            type: 'domain_rank_history', domain: cleanDomain, database: database, export_columns: 'Dt,Ot', display_limit: 12
        };
        const keywordsParams = {
            type: 'domain_organic', domain: cleanDomain, database: database, export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Kd', display_limit: 10
        };
        const competitorsParams = {
            type: 'domain_organic_organic', domain: cleanDomain, database: database, export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad', display_limit: 10
        };

        try {
            const [trendData, keywordsData, competitorsData] = await Promise.all([
                this.fetchWithCache(`domain_rank_history_${cleanDomain}_${database}`, trendParams).catch(() => []),
                this.fetchWithCache(`domain_organic_${cleanDomain}_${database}`, keywordsParams).catch(() => []),
                this.fetchWithCache(`domain_organic_organic_${cleanDomain}_${database}`, competitorsParams).catch(() => [])
            ]);
            
            if (trendData && trendData.length > 0) {
                // Semrush returns history from newest to oldest. Reverse for chart.
                const formattedTrend = trendData.reverse().map(item => {
                    const dateStr = String(item.Date || item.Dt || '');
                    let monthStr = '';
                    if (dateStr.length >= 6) {
                        const year = dateStr.substring(0, 4);
                        const month = dateStr.substring(4, 6);
                        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                        monthStr = dateObj.toLocaleString('default', { month: 'short' });
                    }
                    return { month: monthStr, traffic: Number(item['Organic Traffic'] || item.Ot || 0) };
                });
                overviewData[0].trend = formattedTrend;
            }

            if (keywordsData && keywordsData.length > 0) {
                overviewData[0].topKeywords = keywordsData.map(k => ({
                    keyword: k.Keyword || k.Ph,
                    position: k.Position || k.Po,
                    searchVolume: k['Search Volume'] || k.Nq,
                    cpc: k.CPC || k.Cp,
                    url: k.Url || k.Ur,
                    trafficPercent: k['Traffic (%)'] || k.Tr,
                    difficulty: k['Keyword Difficulty'] || k.Kd
                }));
            }

            if (competitorsData && competitorsData.length > 0) {
                overviewData[0].competitors = competitorsData.map(c => ({
                    domain: c.Domain || c.Dn,
                    relevance: c['Competitor Relevance'] || c.Cr,
                    commonKeywords: c['Common Keywords'] || c.Np,
                    organicKeywords: c['Organic Keywords'] || c.Or,
                    organicTraffic: c['Organic Traffic'] || c.Ot
                }));
            }
        } catch (err) {
            console.error(`[Semrush] Failed to fetch additional overview data:`, err.message);
        }
    }
    
    return overviewData;
  }

  async getKeywordResearch(keyword, database = 'us') {
    const isDomainLike = keyword.includes('.') && !keyword.includes(' ');
    
    if (isDomainLike) {
        const cleanDomain = this.cleanDomain(keyword);
        const queryKey = `keyword_research_domain_${cleanDomain}_${database}`;
        const params = {
          type: 'domain_organic',
          domain: cleanDomain,
          database: database,
          export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Kd',
          display_limit: 100
        };
        try {
            const data = await this.fetchWithCache(queryKey, params);
            return data.map(item => ({
                'Keyword': item.Keyword || item.Ph,
                'Search Volume': item['Search Volume'] || item.Nq,
                'CPC': item.CPC || item.Cp,
                'Keyword Difficulty Index': item['Keyword Difficulty'] || item.Kd,
                'Intent': '', 
                'Position': item.Position || item.Po,
                'isDomainResult': true
            }));
        } catch (e) {
            return [];
        }
    }

    const queryKey = `keyword_research_${keyword}_${database}`;
    const params = {
      type: 'phrase_this',
      phrase: keyword,
      database: database,
      export_columns: 'Ph,Nq,Cp,Co,Kd,In,Td',
      display_limit: 100
    };
    return await this.fetchWithCache(queryKey, params);
  }

  async getDomainKeywordsDrilldown(domain, database = 'us', limit = 100) {
    const cleanDomain = this.cleanDomain(domain);
    const queryKey = `domain_keywords_drilldown_${cleanDomain}_${database}_${limit}`;
    const params = {
      type: 'domain_organic',
      domain: cleanDomain,
      database: database,
      export_columns: 'Ph,Po,Pp,Nq,Kd,Cp,Ur,Tr,Tc,Fp,In',
      display_limit: limit
    };
    
    try {
        const data = await this.fetchWithCache(queryKey, params);
        // Map to standard clean structure
        return data.map(item => ({
            keyword: item.Keyword || item.Ph,
            position: item.Position || item.Po,
            previousPosition: item['Previous Position'] || item.Pp,
            searchVolume: item['Search Volume'] || item.Nq,
            difficulty: item['Keyword Difficulty'] || item.Kd,
            cpc: item.CPC || item.Cp,
            url: item.Url || item.Ur,
            trafficPercent: item['Traffic (%)'] || item.Tr,
            trafficCostPercent: item['Traffic Cost (%)'] || item.Tc,
            serpFeatures: item['SERP Features by Position'] || item.Fp,
            intent: item.Intents || item.In
        }));
    } catch (e) {
        throw new Error('Failed to fetch domain keywords drill-down: ' + e.message);
    }
  }

  async getBacklinksOverview(domain) {
    const cleanDomain = this.cleanDomain(domain);
    const overviewParams = {
      type: 'backlinks_overview',
      target: cleanDomain,
      target_type: 'root_domain',
      export_columns: 'total,domains_num,ips_num,follows_num,nofollows_num,score'
    };
    const anchorsParams = {
      type: 'backlinks_anchors',
      target: cleanDomain,
      target_type: 'root_domain',
      export_columns: 'anchor,backlinks_num,domains_num',
      display_limit: 100
    };
    const refDomainsParams = {
      type: 'backlinks_refdomains',
      target: cleanDomain,
      target_type: 'root_domain',
      export_columns: 'domain,backlinks_num,domain_score',
      display_limit: 100
    };
    
    // Backlinks API requires a different endpoint path
    const baseUrl = 'https://api.semrush.com/analytics/v1';
    
    const [overview, anchors, refDomains] = await Promise.all([
      this.fetchWithCache(`backlinks_overview_${cleanDomain}`, overviewParams, baseUrl),
      this.fetchWithCache(`backlinks_anchors_${cleanDomain}`, anchorsParams, baseUrl),
      this.fetchWithCache(`backlinks_refdomains_${cleanDomain}`, refDomainsParams, baseUrl)
    ]);
    
    if (overview && overview.length > 0) {
      overview[0].anchors = anchors.map(a => ({
        anchor: a.anchor,
        links: a.backlinks_num,
        domains: a.domains_num
      }));
      overview[0].refDomains = refDomains.map(r => ({
        domain: r.domain,
        links: r.backlinks_num,
        authority: r.domain_score
      }));
    }
    
    return overview;
  }

  async getSiteHealth(domain) {
      const cleanDomain = this.cleanDomain(domain);
      
      try {
          const [overviewResult, backlinksResult] = await Promise.all([
            this.getDomainOverview(cleanDomain),
            this.getBacklinksOverview(cleanDomain)
          ]);

          const overview = overviewResult?.[0] || {};
          const backlinks = backlinksResult?.[0] || {};

          // Extract real metrics
          const authority = Number(backlinks.score || overview.Rank || 0);
          const traffic = Number(overview['Organic Traffic'] || overview.Ot || 0);
          const keywords = Number(overview['Organic Keywords'] || overview.Or || 0);
          const followLinks = Number(backlinks.follows_num || 0);
          const nofollowLinks = Number(backlinks.nofollows_num || 0);
          const totalLinks = followLinks + nofollowLinks;

          // Calculate Basic SEO Health Score (0-100)
          let score = 0;
          
          // Authority (up to 40 points, maxing out around 80 authority)
          score += Math.min(40, (authority / 80) * 40);
          
          // Traffic (up to 30 points, maxing out around 10k traffic)
          score += Math.min(30, (traffic / 10000) * 30);
          
          // Keywords (up to 15 points, maxing out around 1000 keywords)
          score += Math.min(15, (keywords / 1000) * 15);
          
          // Backlink Ratio (up to 15 points, optimal is > 60% follow)
          if (totalLinks > 0) {
              const followRatio = followLinks / totalLinks;
              score += Math.min(15, (followRatio / 0.6) * 15);
          }

          score = Math.round(score);
          if (score < 10) score = 10; // Floor

          // Generate dynamic insights
          const strengths = [];
          const weaknesses = [];

          if (authority >= 40) strengths.push({ title: 'Strong Authority', desc: `Domain Authority score is ${authority}` });
          else if (authority > 0) weaknesses.push({ title: 'Low Authority', desc: `Domain Authority score is only ${authority}` });

          if (traffic >= 1000) strengths.push({ title: 'Good Traffic Volume', desc: `${traffic.toLocaleString()} monthly visitors` });
          else weaknesses.push({ title: 'Low Organic Traffic', desc: `${traffic.toLocaleString()} monthly visitors indicates low search visibility` });

          if (keywords >= 500) strengths.push({ title: 'Broad Keyword Reach', desc: `Ranking for ${keywords.toLocaleString()} keywords` });
          else weaknesses.push({ title: 'Limited Keyword Rankings', desc: `Only ranking for ${keywords.toLocaleString()} keywords` });

          if (totalLinks > 0) {
              const followRatio = followLinks / totalLinks;
              if (followRatio >= 0.5) strengths.push({ title: 'Healthy Link Profile', desc: `${Math.round(followRatio * 100)}% follow links` });
              else weaknesses.push({ title: 'Poor Link Ratio', desc: `${Math.round((1 - followRatio) * 100)}% nofollow links limits link equity passing` });
          } else {
              weaknesses.push({ title: 'No Backlink Data', desc: 'No inbound links detected' });
          }

          return {
              isBasicHealth: true,
              overallScore: score,
              metrics: { authority, traffic, keywords, followLinks, nofollowLinks, totalLinks },
              insights: { strengths, weaknesses }
          };
      } catch (err) {
          throw new Error('Failed to calculate Basic SEO Health. ' + err.message);
      }
  }
}

module.exports = new SemrushService();
