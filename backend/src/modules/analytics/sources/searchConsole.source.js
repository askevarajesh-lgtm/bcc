const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const logger = require('../utils/logger');

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

  try {
    cachedAuth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
  } catch (err) {
    logger.error('GSC', 'Failed to initialize auth from GSC_CREDENTIALS', err);
    cachedAuth = null;
  }
  return cachedAuth;
}

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
    const position = impressions > 0
      ? rows.reduce((sum, r) => sum + (r.position || 0) * (r.impressions || 0), 0) / impressions
      : 0;

    return { connected: true, clicks, impressions, ctr, position };
  } catch (error) {
    logger.error('GSC', `Search totals failed for ${siteUrl}`, error);
    return { connected: false, error: error.message, clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
}

module.exports = {
  getSearchTotals
};