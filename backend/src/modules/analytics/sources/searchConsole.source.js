/**
 * Google Search Console data source for the Analytics & Attribution engine.
 * Returns real Search Analytics totals for a verified `siteUrl`, or an
 * explicit not-connected result — never a fabricated number.
 */
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

let cachedAuth = null;
let authResolved = false;

function getAuth() {
  if (authResolved) return cachedAuth;
  authResolved = true;

  const envPath = process.env.GSC_CREDENTIALS;
  if (!envPath) {
    cachedAuth = null;
    return null;
  }

  const resolvedPath = path.resolve(process.cwd(), envPath);
  if (!fs.existsSync(resolvedPath)) {
    cachedAuth = null;
    return null;
  }

  cachedAuth = new google.auth.GoogleAuth({
    keyFile: resolvedPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  return cachedAuth;
}

/**
 * Aggregate Clicks / Impressions / CTR / Average Position for a site + range.
 */
async function getSearchTotals(siteUrl, startDate, endDate) {
  const auth = getAuth();
  if (!auth || !siteUrl) {
    return { connected: false, clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }

  try {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 1000 }
    });

    const rows = res.data.rows || [];
    const clicks = rows.reduce((sum, r) => sum + (r.clicks || 0), 0);
    const impressions = rows.reduce((sum, r) => sum + (r.impressions || 0), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    // Impression-weighted average position — the standard, honest way to
    // aggregate GSC's per-day position values into a single number.
    const position = impressions > 0
      ? rows.reduce((sum, r) => sum + (r.position || 0) * (r.impressions || 0), 0) / impressions
      : 0;

    return { connected: true, clicks, impressions, ctr, position };
  } catch (error) {
    console.error(`[Analytics][GSC] Search totals failed for ${siteUrl}:`, error.message);
    return { connected: false, error: error.message, clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
}

module.exports = {
  getSearchTotals
};
