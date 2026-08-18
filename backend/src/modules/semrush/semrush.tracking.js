const axios = require('axios');
const semrushService = require('./semrush.service');

class SemrushTrackingService {

  /**
   * Fetches real-time position tracking data using the Semrush Position Tracking Report API.
   *
   * If a Semrush campaignId is available (linked via the Management API), it fetches
   * real, crawled rankings — exactly matching what you see in the Semrush dashboard.
   *
   * For any keywords not yet in the Semrush campaign, it falls back to the global
   * phrase_this API to at least provide search volume and CPC data.
   *
   * @param {string} domain - e.g. "askeva.io"
   * @param {string} database - e.g. "in" or "us"
   * @param {string[]} keywords - user-configured keywords
   * @param {string|null} campaignId - Semrush campaign ID e.g. "30536667_5180087"
   */
  async getPositionTrackingData(domain, database, keywords, campaignId = null, force = false, companyId = 'global') {
    if (!keywords || keywords.length === 0) return [];

    const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

    if (!campaignId) {
      return { error: 'campaign_unavailable' };
    }

    // -----------------------------------------------------------------------
    // 1. Fetch Position Tracking Report from Semrush
    // -----------------------------------------------------------------------
    const rankingMap = {};
    const visibilityHistory = {};
    let overviewMetrics = { visibility: null, traffic: null, avgPosition: null, top3: null, top10: null, top100: null };

    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      const reportUrl = `https://api.semrush.com/reports/v1/projects/${campaignId}/tracking/`;
      const domainKey = `*.${cleanDomain}/*`;
      const response = await axios.get(reportUrl, {
        params: {
          key: apiKey,
          type: 'tracking_position_organic',
          action: 'report',
          url: domainKey,
          display_limit: 10000
        }
      });

      const reportData = response.data;

      if (reportData && reportData.data && typeof reportData.data === 'object') {
        const entries = Object.values(reportData.data);

        for (const entry of entries) {
          const kw = (entry.Ph || '').toLowerCase().trim();
          if (!kw) continue;

          // Dt holds date-keyed position data. Get the dates sorted descending.
          const dtDates = entry.Dt ? Object.keys(entry.Dt).filter(d => /^\d{8}$/.test(d)).sort().reverse() : [];
          const latestDate = dtDates[0];
          const prevDate = dtDates[1];

          const getVal = (obj, dt) => {
            if (!obj || !obj[dt]) return null;
            const valObj = obj[dt];
            if (valObj[domainKey] !== undefined) return valObj[domainKey];
            if (valObj[cleanDomain] !== undefined) return valObj[cleanDomain];
            return Object.values(valObj)[0] ?? null;
          };

          const latestPos = getVal(entry.Dt, latestDate);
          const prevPos = getVal(entry.Dt, prevDate);

          // The landing URL might be in Lu or Ur, and the key might differ
          const latestUrl = getVal(entry.Lu || entry.Ur, latestDate);

          const diff1Raw = getVal(entry.Diff1, latestDate) ?? (entry.Diff1 ? (entry.Diff1[domainKey] || entry.Diff1[cleanDomain]) : undefined);
          const diff1 = diff1Raw !== undefined && diff1Raw !== null ? Number(diff1Raw) : null;

          const diff7Raw = getVal(entry.Diff7, latestDate) ?? (entry.Diff7 ? (entry.Diff7[domainKey] || entry.Diff7[cleanDomain]) : undefined);
          const diff7 = diff7Raw !== undefined && diff7Raw !== null ? Number(diff7Raw) : null;

          const visibilityRaw = getVal(entry.Vi, latestDate);
          const visibility = visibilityRaw !== null ? Number(visibilityRaw) : null;

          const visibilityDiffRaw = entry.Vi && entry.Vi.Diff ? (entry.Vi.Diff[domainKey] ?? entry.Vi.Diff[cleanDomain] ?? null) : null;
          const visibilityDiff = visibilityDiffRaw !== null ? Number(visibilityDiffRaw) : null;

          const trafficRaw = getVal(entry.Tr, latestDate);
          const traffic = trafficRaw !== null ? Number(trafficRaw) : null;

          const serpFeatures = latestDate && entry.Sf && Array.isArray(entry.Sf[latestDate]) ? entry.Sf[latestDate] : [];

          rankingMap[kw] = {
            position: latestPos ? this._parsePosition(latestPos) : null,
            previousPosition: prevPos ? this._parsePosition(prevPos) : null,
            url: latestUrl,
            diff1,
            diff7,
            searchVolume: entry.Nq !== undefined && entry.Nq !== null ? entry.Nq : null,
            cpc: entry.Cp !== undefined && entry.Cp !== null ? entry.Cp : null,
            intent: entry.In ? Object.values(entry.In).join(',') : null,
            visibility,
            visibilityDiff,
            traffic,
            serpFeaturesCount: serpFeatures.length
          };

          // Aggregate historical visibility for the trend chart
          if (entry.Vi) {
            Object.keys(entry.Vi).forEach(dateStr => {
               if (dateStr === 'Diff') return;
               const v = entry.Vi[dateStr][domainKey] ?? entry.Vi[dateStr][cleanDomain] ?? 0;
               if (!visibilityHistory[dateStr]) visibilityHistory[dateStr] = 0;
               visibilityHistory[dateStr] += Number(v);
            });
          }
        }
      }
    } catch (err) {
      console.error('[SemrushTracking] Failed to fetch from Position Tracking Report API:', err.message);
      if (err.response && err.response.data && String(err.response.data).includes('ERROR')) {
         return { error: 'campaign_unavailable' };
      }
    }
    
    // -----------------------------------------------------------------------
    // 2. Fetch tracking overview
    // -----------------------------------------------------------------------
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      const overviewUrl = `https://api.semrush.com/reports/v1/projects/${campaignId}/tracking/`;
      const ovRes = await axios.get(overviewUrl, {
        params: {
          key: apiKey,
          type: 'tracking_overview_organic',
          action: 'report',
          url: `*.${cleanDomain}/*`
        }
      });
      if (ovRes.data && typeof ovRes.data === 'object') {
        overviewMetrics = {
          visibility: ovRes.data.visibility || null,
          traffic: null, // Computed below
          avgPosition: null, // Computed below
          top3: ovRes.data.top3 || 0,
          top10: ovRes.data.top10 || 0,
          top100: ovRes.data.top100 || 0
        };
      }
    } catch (err) {
      console.error('[SemrushTracking] Failed to fetch overview metrics:', err.message);
    }

    // -----------------------------------------------------------------------
    // 3. Optional Metadata (Volume/KD/CPC) via phrase_this IF needed
    // -----------------------------------------------------------------------
    if (keywords.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        await Promise.all(batch.map(async (rawKw) => {
          const kw = rawKw.trim();
          if (!kw) return;
          const kwLower = kw.toLowerCase();

          try {
            const metricsData = await semrushService.fetchWithCache(
              `phrase_this_${kw}_${database}`,
              companyId,
              kw,
              { type: 'phrase_this', phrase: kw, database, export_columns: 'Ph,Nq,Kd,Cp,In' },
              null,
              force
            ).catch(() => []);
            
            const metrics = Array.isArray(metricsData) && metricsData.length > 0 ? metricsData[0] : {};
            const kd = metrics['Keyword Difficulty Index'] ?? metrics['Keyword Difficulty'] ?? metrics.Kd ?? null;
            const volume = metrics['Search Volume'] ?? metrics.Nq ?? null;
            const cpc = metrics['CPC'] ?? metrics.Cp ?? null;
            const intent = metrics['Intent'] ?? metrics.Intents ?? metrics.In ?? null;
            
            if (rankingMap[kwLower]) {
               // Update ONLY metadata, NEVER mapping rankings here
               rankingMap[kwLower].difficulty = kd;
               if (rankingMap[kwLower].searchVolume === null) rankingMap[kwLower].searchVolume = volume;
               if (rankingMap[kwLower].cpc === null) rankingMap[kwLower].cpc = cpc;
               if (rankingMap[kwLower].intent === null) rankingMap[kwLower].intent = intent;
            } else {
               // Keyword missing from Semrush Tracking Report entirely
               // DO NOT populate fake rankings. Map metadata and leave rankings null.
               rankingMap[kwLower] = {
                 position: null,
                 previousPosition: null,
                 url: null,
                 diff1: null,
                 diff7: null,
                 searchVolume: volume,
                 difficulty: kd,
                 cpc: cpc,
                 intent: intent,
                 visibility: null,
                 traffic: null,
                 serpFeaturesCount: null
               };
            }
          } catch (err) {
            console.error(`[SemrushTracking] phrase_this failed for "${kw}":`, err.message);
          }
        }));

        if (i + batchSize < keywords.length) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    }

    // -----------------------------------------------------------------------
    // Merge keywords from DB and keywords actually tracked in Semrush
    const keywordSet = new Set(keywords.map(k => k.toLowerCase().trim()).filter(Boolean));
    Object.keys(rankingMap).forEach(k => keywordSet.add(k));

    const rankings = Array.from(keywordSet).map(kwLower => {
      // Preserve original casing from DB if available
      const rawKw = keywords.find(k => k.toLowerCase().trim() === kwLower) || Object.keys(rankingMap).find(k => k.toLowerCase() === kwLower) || kwLower;
      
      const data = rankingMap[kwLower] || {
        position: null,
        previousPosition: null,
        url: null,
        diff1: null,
        diff7: null,
        searchVolume: null,
        difficulty: null,
        cpc: null,
        intent: null,
        visibility: null,
        visibilityDiff: null,
        traffic: null,
        serpFeaturesCount: null
      };

      return {
        keyword: rawKw,
        position: data.position,
        previousPosition: data.previousPosition,
        url: data.url,
        diff1: data.diff1,
        diff7: data.diff7,
        searchVolume: data.searchVolume,
        difficulty: data.difficulty ?? null,
        cpc: data.cpc,
        intent: data.intent,
        visibility: data.visibility,
        visibilityDiff: data.visibilityDiff,
        traffic: data.traffic,
        serpFeaturesCount: data.serpFeaturesCount,
        isTrackedBySemrush: data.position !== null
      };
    });

    // Compute Est. Traffic and Avg. Position from the ENTIRE campaign's keywords
    let sumTraffic = 0;
    let sumPosition = 0;
    let kwCount = 0;

    for (const r of rankings) {
      if (r.traffic) {
        sumTraffic += r.traffic;
      }
      // Only include keywords actually tracked in Semrush in the average position calculation
      if (r.isTrackedBySemrush) {
        let pos = r.position === '> 100' ? 100 : Number(r.position);
        if (!pos || isNaN(pos)) pos = 100;
        sumPosition += pos;
        kwCount++;
      }
    }

    overviewMetrics.traffic = sumTraffic;
    overviewMetrics.avgPosition = kwCount > 0 ? (sumPosition / kwCount) : 0;


    // Sort visibility history by date string (keys are like "20260812")
    const trendData = Object.keys(visibilityHistory).sort().map(dateStr => {
      // dateStr is YYYYMMDD
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return {
        date: `${year}-${month}-${day}`,
        visibility: visibilityHistory[dateStr]
      };
    });

    return {
      rankings,
      overview: overviewMetrics,
      trend: trendData
    };
  }

  /**
   * Converts a raw Semrush position value to a display string.
   * Semrush uses "-" for "not in top 100", 0 for the same, or a numeric string.
   */
  _parsePosition(val) {
    if (val === null || val === undefined) return null;
    if (val === '-' || val === 0 || val === '0' || val === '> 100') return '> 100';
    return String(val);
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
}

module.exports = new SemrushTrackingService();
