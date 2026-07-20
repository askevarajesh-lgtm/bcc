const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * Validates if the credentials file exists and returns the resolved path.
 */
const getCredentialsPath = (envPath) => {
  if (!envPath) return null;
  const resolvedPath = path.resolve(process.cwd(), envPath);
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }
  return null;
};

/**
 * Query GA4 for overall sessions, active users, bounce rate, etc.
 */
exports.getGA4Report = async (propertyId, startDate = '30daysAgo', endDate = 'today') => {
  try {
    const credsPath = getCredentialsPath(process.env.GA4_CREDENTIALS);
    if (!credsPath) {
      console.warn('GA4_CREDENTIALS not found or invalid path.');
      return null;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credsPath
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'sessionSourceMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'bounceRate' }
      ],
    });

    return response;
  } catch (error) {
    console.error('Error fetching GA4 report:', error.message);
    return null;
  }
};

/**
 * Query GA4 for Top Pages by traffic
 */
exports.getGA4TopPages = async (propertyId, startDate = '30daysAgo', endDate = 'today') => {
  try {
    const credsPath = getCredentialsPath(process.env.GA4_CREDENTIALS);
    if (!credsPath) {
      return null;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credsPath
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10
    });

    return response;
  } catch (error) {
    console.error('Error fetching GA4 Top Pages:', error.message);
    return null;
  }
};

/**
 * Query GSC for organic clicks and impressions (Optional / Future use)
 */
exports.getGSCSearchAnalytics = async (siteUrl, startDate, endDate) => {
  try {
    const credsPath = getCredentialsPath(process.env.GSC_CREDENTIALS);
    if (!credsPath) {
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query']
      }
    });

    return res.data;
  } catch (error) {
    console.error('Error fetching GSC data:', error.message);
    return null;
  }
};
