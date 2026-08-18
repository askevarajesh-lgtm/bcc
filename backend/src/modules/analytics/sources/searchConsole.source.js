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

async function getSearchTotals(siteUrl, startDate, endDate, type = 'web') {
  const auth = getAuth();
  if (!auth || !siteUrl) {
    return { connected: false, clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }

  const executeQuery = async (urlToQuery) => {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    return await searchconsole.searchanalytics.query({
      siteUrl: urlToQuery,
      requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 1000, type }
    });
  };

  try {
    let res;
    try {
      res = await executeQuery(siteUrl);
    } catch (err) {
      if (err.message && err.message.includes('sufficient permission') && siteUrl.startsWith('http')) {
        const bareDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        res = await executeQuery(`sc-domain:${bareDomain}`);
      } else {
        throw err;
      }
    }

    const rows = res.data.rows || [];
    const clicks = rows.reduce((sum, r) => sum + (r.clicks || 0), 0);
    const impressions = rows.reduce((sum, r) => sum + (r.impressions || 0), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const position = impressions > 0
      ? rows.reduce((sum, r) => sum + (r.position || 0) * (r.impressions || 0), 0) / impressions
      : 0;

    const searchTraffic = rows.map(r => ({
      day: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? r.ctr * 100 : 0,
      position: r.position || 0
    })).sort((a, b) => a.day.localeCompare(b.day));

    return { connected: true, clicks, impressions, ctr, position, searchTraffic };
  } catch (error) {
    logger.error('GSC', `Search totals failed for ${siteUrl}`, error);
    return { connected: false, error: error.message, clicks: 0, impressions: 0, ctr: 0, position: 0, searchTraffic: [] };
  }
}

async function getSearchBreakdown(siteUrl, dimension, startDate, endDate, limit = 50, type = 'web') {
  const auth = getAuth();
  if (!auth || !siteUrl) return [];

  const executeQuery = async (urlToQuery) => {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    return await searchconsole.searchanalytics.query({
      siteUrl: urlToQuery,
      requestBody: { startDate, endDate, dimensions: [dimension], rowLimit: limit, type }
    });
  };

  try {
    let res;
    try {
      res = await executeQuery(siteUrl);
    } catch (err) {
      if (err.message && err.message.includes('sufficient permission') && siteUrl.startsWith('http')) {
        const bareDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        res = await executeQuery(`sc-domain:${bareDomain}`);
      } else {
        throw err;
      }
    }

    const rows = res.data.rows || [];
    return rows.map(r => ({
      dimension: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? r.ctr * 100 : 0,
      position: r.position || 0
    })).sort((a, b) => b.clicks - a.clicks);
  } catch (error) {
    logger.error('GSC', `Search breakdown failed for ${siteUrl} on ${dimension}`, error);
    return [];
  }
}

module.exports = {
  getSearchTotals,
  getSearchBreakdown
};