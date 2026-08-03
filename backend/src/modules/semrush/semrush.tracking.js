const axios = require('axios');
const semrushService = require('./semrush.service'); // for fetchWithCache and caching models

class SemrushTrackingService {
  /**
   * Fetches the real-time position tracking data for a given domain and set of keywords.
   * Uses phrase_this for keyword metrics and domain_organic for rank positions.
   */
  async getPositionTrackingData(domain, database, keywords) {
    if (!keywords || keywords.length === 0) return [];
    
    // 1. Fetch keyword metrics using phrase_this
    // Semrush phrase_this strictly accepts exactly ONE keyword per request.
    const keywordMetrics = {};
    
    // Process in batches of 5 to strictly respect Semrush's 10 requests/sec limit
    // and avoid 429 Too Many Requests which results in 0 volume data.
    const batchSize = 5;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
      const metricsPromises = batch.map(async (rawKw) => {
        const kw = rawKw.trim();
        if (!kw) return;
        
        const params = {
          type: 'phrase_this',
          phrase: kw,
          database: database,
          export_columns: 'Ph,Nq,Kd,Cp,In' // Phrase, Search Volume, KD, CPC, Intent
        };
        
        try {
          const data = await semrushService.fetchWithCache(`phrase_this_${kw}_${database}`, params);
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            const matchedKw = (item.Keyword || item.Ph || '').toLowerCase();
            if (matchedKw) {
              keywordMetrics[matchedKw] = {
                searchVolume: item['Search Volume'] || item.Nq || '0',
                cpc: item.CPC || item.Cp || '0',
                difficulty: item['Keyword Difficulty Index'] || item.Kd || '0',
                intent: item.Intents || item.In || ''
              };
            }
          }
        } catch (err) {
          console.error(`[Semrush Tracking] Failed to fetch metrics for ${kw}:`, err.message);
        }
      });
      
      await Promise.all(metricsPromises);
      // Small delay between batches to ensure we stay under the rate limit
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
    
    // 2. Fetch the domain's organic keywords to find the current positions
    // We fetch a larger limit (e.g., top 500) to find if the tracked keywords rank
    const domainParams = {
      type: 'domain_organic',
      domain: domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      database: database,
      export_columns: 'Ph,Po,Pp,Ur,Tr', // Phrase, Position, Previous Position, URL, Traffic %
      display_limit: 500
    };
    
    const domainRankings = await semrushService.fetchWithCache(`domain_organic_tracking_${domain}_${database}`, domainParams);
    
    const rankingMap = {};
    if (Array.isArray(domainRankings)) {
      domainRankings.forEach(item => {
        const kw = (item.Keyword || item.Ph || '').toLowerCase();
        if (kw) {
          rankingMap[kw] = {
            position: item.Position || item.Po || '0',
            previousPosition: item['Previous Position'] || item.Pp || '0',
            url: item.Url || item.Ur || '',
            trafficPercent: item['Traffic (%)'] || item.Tr || '0'
          };
        }
      });
    }
    
    // 3. Merge data
    const trackingData = keywords.map(rawKw => {
      const kw = rawKw.toLowerCase().trim();
      const metrics = keywordMetrics[kw] || { searchVolume: '0', cpc: '0', difficulty: '0', intent: '' };
      const ranking = rankingMap[kw] || { position: '101', previousPosition: '0', url: '-', trafficPercent: '0' }; // >100 if not found
      
      return {
        keyword: rawKw,
        searchVolume: metrics.searchVolume,
        cpc: metrics.cpc,
        difficulty: metrics.difficulty,
        intent: metrics.intent,
        position: ranking.position === '101' ? '> 100' : ranking.position,
        previousPosition: ranking.previousPosition,
        url: ranking.url,
        trafficPercent: ranking.trafficPercent
      };
    });
    
    return trackingData;
  }
  
  chunkArray(array, size) {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
      chunked.push(array.slice(index, size + index));
      index += size;
    }
    return chunked;
  }

  chunkArrayByLength(array, maxLength) {
    const chunked = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const item of array) {
      const itemLen = item.length;
      // +1 for the comma if it's not the first item in the chunk
      const addition = currentChunk.length === 0 ? itemLen : itemLen + 1;
      
      if (currentLength + addition > maxLength && currentChunk.length > 0) {
        chunked.push(currentChunk);
        currentChunk = [item];
        currentLength = itemLen;
      } else {
        currentChunk.push(item);
        currentLength += addition;
      }
    }
    if (currentChunk.length > 0) {
      chunked.push(currentChunk);
    }
    return chunked;
  }
}

module.exports = new SemrushTrackingService();
