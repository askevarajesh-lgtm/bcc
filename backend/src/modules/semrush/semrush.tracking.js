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
  async getPositionTrackingData(domain, database, keywords, campaignId = null) {
    if (!keywords || keywords.length === 0) return [];

    const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

    // -----------------------------------------------------------------------
    // 1. Fetch Position Tracking Report from Semrush (if campaignId exists)
    // -----------------------------------------------------------------------
    const rankingMap = {}; // keyword (lower) -> { position, previousPosition, url, diff1, diff7 }

    if (campaignId) {
      try {
        const apiKey = process.env.SEMRUSH_API_KEY;
        const reportUrl = `https://api.semrush.com/reports/v1/projects/${campaignId}/tracking/`;
        const response = await axios.get(reportUrl, {
          params: {
            key: apiKey,
            type: 'tracking_position_organic',
            action: 'report',
            url: cleanDomain
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

            const latestPos = latestDate ? entry.Dt[latestDate][cleanDomain] : '-';
            const prevPos = prevDate ? entry.Dt[prevDate][cleanDomain] : '-';

            // Get the landing URL on the latest date
            const latestUrl = latestDate && entry.Lu && entry.Lu[latestDate]
              ? entry.Lu[latestDate][cleanDomain] || '-'
              : '-';

            const diff1 = entry.Diff1 ? (entry.Diff1[cleanDomain] || 0) : 0;
            const diff7 = entry.Diff7 ? (entry.Diff7[cleanDomain] || 0) : 0;

            rankingMap[kw] = {
              position: this._parsePosition(latestPos),
              previousPosition: this._parsePosition(prevPos),
              url: latestUrl,
              diff1,
              diff7,
              searchVolume: entry.Nq || '0',
              cpc: entry.Cp || '0',
              intent: entry.In ? Object.values(entry.In).join(',') : ''
            };
          }
        }
      } catch (err) {
        console.error('[SemrushTracking] Failed to fetch from Position Tracking Report API:', err.message);
      }
    }

    // -----------------------------------------------------------------------
    // 2. Fetch keyword metrics for keywords not found in campaign
    //    using phrase_this (search volume, KD, CPC)
    // -----------------------------------------------------------------------
    const missingKeywords = keywords.filter(kw => !rankingMap[kw.toLowerCase().trim()]);

    if (missingKeywords.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < missingKeywords.length; i += batchSize) {
        const batch = missingKeywords.slice(i, i + batchSize);
        await Promise.all(batch.map(async (rawKw) => {
          const kw = rawKw.trim();
          if (!kw) return;

          try {
            const metricsData = await semrushService.fetchWithCache(
              `phrase_this_${kw}_${database}`,
              { type: 'phrase_this', phrase: kw, database, export_columns: 'Ph,Nq,Kd,Cp,In' }
            ).catch(() => []);

            const metrics = Array.isArray(metricsData) && metricsData.length > 0 ? metricsData[0] : {};

            if (!rankingMap[kw.toLowerCase()]) {
              rankingMap[kw.toLowerCase()] = {
                position: '> 100',
                previousPosition: '-',
                url: '-',
                diff1: 0,
                diff7: 0,
                searchVolume: metrics['Search Volume'] || metrics.Nq || '0',
                cpc: metrics.CPC || metrics.Cp || '0',
                intent: metrics.Intents || metrics.In || ''
              };
            }
          } catch (err) {
            console.error(`[SemrushTracking] phrase_this failed for "${kw}":`, err.message);
          }
        }));

        if (i + batchSize < missingKeywords.length) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. Build the final response array in the same order as user's keywords
    // -----------------------------------------------------------------------
    return keywords.map(rawKw => {
      const kw = rawKw.toLowerCase().trim();
      const data = rankingMap[kw] || {
        position: '> 100',
        previousPosition: '-',
        url: '-',
        diff1: 0,
        diff7: 0,
        searchVolume: '0',
        cpc: '0',
        intent: ''
      };

      return {
        keyword: rawKw,
        position: data.position,
        previousPosition: data.previousPosition,
        url: data.url,
        diff1: data.diff1,
        diff7: data.diff7,
        searchVolume: data.searchVolume,
        cpc: data.cpc,
        intent: data.intent,
        isTrackedBySemrush: !!campaignId && !!rankingMap[kw]
      };
    });
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
