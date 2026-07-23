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
   * @returns {Promise<Object>} The JSON data
   */
  async fetchWithCache(queryKey, params) {
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
      const response = await axios.get(this.baseUrl, {
        headers: {
          'Authorization': `Apikey ${apiKey}`
        },
        params: {
          key: apiKey, // Keep for backward compatibility with v3 if needed
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
    return await this.fetchWithCache(queryKey, params);
  }

  async getKeywordResearch(keyword, database = 'us') {
    const queryKey = `keyword_research_${keyword}_${database}`;
    const params = {
      type: 'phrase_this',
      phrase: keyword,
      database: database,
      export_columns: 'Ph,Nq,Cp,Co,Kd,In,Td'
    };
    return await this.fetchWithCache(queryKey, params);
  }

  async getBacklinksOverview(domain) {
    const cleanDomain = this.cleanDomain(domain);
    const queryKey = `backlinks_overview_${cleanDomain}`;
    const params = {
      type: 'backlinks_overview',
      target: cleanDomain,
      target_type: 'root_domain',
      export_columns: 'total,domains_num,ips_num,follows_num,nofollows_num,score'
    };
    return await this.fetchWithCache(queryKey, params);
  }

  async getSiteHealth(domain) {
      const cleanDomain = this.cleanDomain(domain);
      // NOTE: Site Audit API requires a separate Semrush project which is more complex.
      // This is a placeholder that simulates checking some scores for a domain using available APIs
      // In a real scenario you would interact with Semrush's Projects API.
      const queryKey = `site_health_${cleanDomain}`;
      const params = {
        type: 'domain_ranks',
        domain: cleanDomain,
        database: 'us',
        export_columns: 'Dn,Rk,Or'
      };
      
      const domainData = await this.fetchWithCache(queryKey, params);
      
      // Simulating site health data based on the domain overview as true Site Audit requires Projects API setup
      return {
          overallScore: 85,
          brokenPages: Math.floor(Math.random() * 20),
          missingTitles: Math.floor(Math.random() * 15),
          missingDescriptions: Math.floor(Math.random() * 30),
          httpErrors: Math.floor(Math.random() * 5),
          raw: domainData
      };
  }
}

module.exports = new SemrushService();
