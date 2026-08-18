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

    // -----------------------------------------------------------------------
    // 1. Fetch Position Tracking Report from Semrush (if campaignId exists)
    // -----------------------------------------------------------------------
    const rankingMap = {};
    const visibilityHistory = {};
    let overviewMetrics = { visibility: 0, traffic: 0, avgPosition: 0, top3: 0, top10: 0, top100: 0 };

    if (campaignId) {
      try {
        const apiKey = process.env.SEMRUSH_API_KEY;
        const reportUrl = `https://api.semrush.com/reports/v1/projects/${campaignId}/tracking/`;
        const domainKey = `*.${cleanDomain}/*`;
        const response = await axios.get(reportUrl, {
          params: {
            key: apiKey,
            type: 'tracking_position_organic',
            action: 'report',
            url: domainKey
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

            const latestPos = latestDate ? (entry.Dt[latestDate][domainKey] || entry.Dt[latestDate][cleanDomain]) : '-';
            const prevPos = prevDate ? (entry.Dt[prevDate][domainKey] || entry.Dt[prevDate][cleanDomain]) : '-';

            // Get the landing URL on the latest date
            const latestUrl = latestDate && entry.Lu && entry.Lu[latestDate]
              ? (entry.Lu[latestDate][domainKey] || entry.Lu[latestDate][cleanDomain] || '-')
              : '-';

            const diff1Raw = entry.Diff1 ? (entry.Diff1[domainKey] || entry.Diff1[cleanDomain]) : undefined;
            const diff1 = diff1Raw !== undefined && diff1Raw !== null ? Number(diff1Raw) : null;

            const diff7Raw = entry.Diff7 ? (entry.Diff7[domainKey] || entry.Diff7[cleanDomain]) : undefined;
            const diff7 = diff7Raw !== undefined && diff7Raw !== null ? Number(diff7Raw) : null;

            const visibilityRaw = latestDate && entry.Vi && entry.Vi[latestDate] ? (entry.Vi[latestDate][domainKey] ?? entry.Vi[latestDate][cleanDomain]) : 0;
            const visibility = visibilityRaw ? Number(visibilityRaw) : 0;

            const trafficRaw = latestDate && entry.Tr && entry.Tr[latestDate] ? (entry.Tr[latestDate][domainKey] ?? entry.Tr[latestDate][cleanDomain]) : 0;
            const traffic = trafficRaw ? Number(trafficRaw) : 0;

            const serpFeatures = latestDate && entry.Sf && Array.isArray(entry.Sf[latestDate]) ? entry.Sf[latestDate] : [];

            rankingMap[kw] = {
              position: this._parsePosition(latestPos),
              previousPosition: this._parsePosition(prevPos),
              url: latestUrl,
              diff1,
              diff7,
              searchVolume: entry.Nq !== undefined && entry.Nq !== null ? entry.Nq : null,
              cpc: entry.Cp !== undefined && entry.Cp !== null ? entry.Cp : null,
              intent: entry.In ? Object.values(entry.In).join(',') : '',
              visibility,
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
      }
      
      // Also fetch the tracking overview to get exact top-level metrics
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
            visibility: ovRes.data.visibility || 0,
            traffic: ovRes.data.est_traffic || 0,
            avgPosition: ovRes.data.avg_position || 0,
            top3: ovRes.data.top3 || 0,
            top10: ovRes.data.top10 || 0,
            top100: ovRes.data.top100 || 0
          };
        }
      } catch (err) {
        console.error('[SemrushTracking] Failed to fetch overview metrics:', err.message);
      }
    }

    // -----------------------------------------------------------------------
    // 2. Fetch keyword metrics for ALL keywords to get KD% using phrase_this
    //    (and also fetch organic positions for any keywords NOT in the campaign)
    // -----------------------------------------------------------------------
    if (keywords.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        await Promise.all(batch.map(async (rawKw) => {
          const kw = rawKw.trim();
          if (!kw) return;
          
          const kwLower = kw.toLowerCase();
          const hasCampaignData = !!rankingMap[kwLower];

          try {
            // We ALWAYS need phrase_this to get KD% (since tracking report doesn't have it)
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
            
            if (hasCampaignData) {
               // Update existing campaign data with KD
               rankingMap[kwLower].difficulty = kd;
               // We can also fallback volume if missing from campaign
               if (!rankingMap[kwLower].searchVolume) {
                  rankingMap[kwLower].searchVolume = metrics['Search Volume'] ?? metrics.Nq ?? null;
               }
            } else {
              // Keyword is completely missing from campaign, we must do a live phrase_organic lookup
              const organicData = await semrushService.fetchWithCache(
                `phrase_organic_${kw}_${database}`,
                companyId,
                kw,
                { type: 'phrase_organic', phrase: kw, database, export_columns: 'Dn,Ur,Po', display_limit: 100 },
                null,
                force
              ).catch(() => []);

              let actualPosition = '> 100';
              let actualUrl = '-';
              
              if (Array.isArray(organicData)) {
                 const domainRow = organicData.find(row => {
                   const d = (row['Domain'] || row.Dn || row.domain || '').toLowerCase().replace(/^www\./, '');
                   return d === cleanDomain || d.endsWith(`.${cleanDomain}`);
                 });
                 if (domainRow) {
                    const rawPos = domainRow['Position'] || domainRow.Po || domainRow.position;
                    actualPosition = rawPos ? String(rawPos) : '> 100';
                    actualUrl = domainRow['Url'] || domainRow.Ur || domainRow.url || '-';
                 }
              }

              rankingMap[kwLower] = {
                position: actualPosition,
                previousPosition: '-',
                url: actualUrl,
                diff1: 0,
                diff7: 0,
                searchVolume: metrics['Search Volume'] ?? metrics.Nq ?? null,
                difficulty: kd,
                cpc: metrics['CPC'] ?? metrics.Cp ?? null,
                intent: metrics['Intent'] ?? metrics.Intents ?? metrics.In ?? '',
                visibility: 0,
                traffic: 0,
                serpFeaturesCount: 0
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
    // 3. Build the final response array in the same order as user's keywords
    // -----------------------------------------------------------------------
    const rankings = keywords.map(rawKw => {
      const kw = rawKw.toLowerCase().trim();
      const data = rankingMap[kw] || {
        position: '> 100',
        previousPosition: '-',
        url: '-',
        diff1: 0,
        diff7: 0,
        searchVolume: '0',
        cpc: '0',
        intent: '',
        visibility: 0,
        traffic: 0,
        serpFeaturesCount: 0
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
        trafficPercent: data.trafficPercent ?? null,
        cpc: data.cpc,
        intent: data.intent,
        visibility: data.visibility,
        traffic: data.traffic,
        serpFeaturesCount: data.serpFeaturesCount,
        isTrackedBySemrush: !!campaignId && !!rankingMap[kw]
      };
    });
    
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
  _parsePosition(raw) {
    if (raw === '-' || raw === null || raw === undefined || raw === '' || raw === 0 || raw === '0') {
      return '> 100';
    }
    return String(raw);
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
