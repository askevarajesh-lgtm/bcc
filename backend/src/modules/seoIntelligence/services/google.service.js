const { google } = require('googleapis');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

class GoogleService {
  constructor(credentialsPath) {
    this.credentialsPath = credentialsPath;
    
    // Check if credentials exist, otherwise log warning
    if (credentialsPath) {
      try {
        this.auth = new google.auth.GoogleAuth({
          keyFile: credentialsPath,
          scopes: [
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/analytics.readonly'
          ],
        });
        this.configured = true;
      } catch (error) {
        console.warn(`[GoogleService] NOT CONFIGURED: Invalid credentials at ${credentialsPath}`);
        this.configured = false;
      }
    } else {
      console.warn(`[GoogleService] NOT CONFIGURED: credentialsPath is missing`);
      this.configured = false;
    }
  }

  /**
   * Fetches Google Search Console data (Clicks, Impressions, CTR, Position)
   */
  async getSearchConsoleData(siteUrl, startDate, endDate) {
    if (!this.configured) return { clicks: 0, impressions: 0, ctr: 0, position: 0, rows: [] };

    try {
      const searchconsole = google.webmasters({ version: 'v3', auth: this.auth });
      const response = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl, // e.g. "sc-domain:example.com" or "https://example.com/"
        requestBody: {
          startDate: startDate, // e.g. '2023-01-01'
          endDate: endDate,     // e.g. '2023-01-31'
          dimensions: ['date'],
          rowLimit: 1000
        }
      });

      const rows = response.data.rows || [];
      const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
      const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgPos = rows.reduce((sum, r) => sum + (r.position * r.impressions), 0) / (totalImpressions || 1);

      return {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr,
        position: avgPos,
        rows: rows
      };
    } catch (error) {
      console.error('[GoogleService] GSC Error:', error.message);
      return { clicks: 0, impressions: 0, ctr: 0, position: 0, rows: [], error: error.message };
    }
  }

  /**
   * Fetches Google Analytics 4 data (Sessions, Users, Conversions)
   */
  async getAnalyticsData(propertyId, startDate, endDate) {
    if (!this.configured) return { sessions: 0, users: 0, conversions: 0, rows: [] };

    try {
      const analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: this.credentialsPath,
      });

      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          { startDate: startDate, endDate: endDate },
        ],
        dimensions: [
          { name: 'date' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'conversions' }, // Note: depending on GA4 setup this might be keyEvents
        ],
      });

      const rows = response.rows.map(row => ({
        date: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value, 10),
        users: parseInt(row.metricValues[1].value, 10),
        conversions: parseInt(row.metricValues[2].value, 10),
      }));

      const totalSessions = rows.reduce((sum, r) => sum + r.sessions, 0);
      const totalUsers = rows.reduce((sum, r) => sum + r.users, 0);
      const totalConversions = rows.reduce((sum, r) => sum + r.conversions, 0);

      return {
        sessions: totalSessions,
        users: totalUsers,
        conversions: totalConversions,
        rows: rows
      };
    } catch (error) {
      console.error('[GoogleService] GA4 Error:', error.message);
      return { sessions: 0, users: 0, conversions: 0, rows: [], error: error.message };
    }
  }
}

module.exports = GoogleService;
