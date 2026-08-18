/**
 * AI Core — PageSpeed Insights Provider
 *
 * Normalizes the Google PageSpeed Insights API call.
 *
 * PSI failures are intentionally propagated to the caller so the
 * caller can fall back to DataForSEO instead of returning fake data.
 */

const axios = require('axios');

const PSI_ENDPOINT =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

const VALID_STRATEGIES = ['desktop', 'mobile'];

/**
 * Validate website URL.
 *
 * @param {string} siteUrl
 * @throws {Error}
 */
function validateSiteUrl(siteUrl) {
  if (!siteUrl || typeof siteUrl !== 'string') {
    throw new Error('A valid site URL is required');
  }

  try {
    const url = new URL(siteUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }
  } catch {
    throw new Error(`Invalid site URL: ${siteUrl}`);
  }
}

/**
 * Fetch PageSpeed Insights data.
 *
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {'desktop'|'mobile'} [options.strategy='desktop']
 * @param {number} [options.timeoutMs=12000]
 *
 * @returns {Promise<{
 *   score: number|null,
 *   coreWebVitals: {
 *     lcp: number|null,
 *     inp: number|null,
 *     cls: number|null
 *   },
 *   raw: Object|null
 * }>}
 */
async function fetchPsi(siteUrl, options = {}) {
  const {
    strategy = 'desktop',
    timeoutMs = 12000
  } = options;

  // Validate URL
  validateSiteUrl(siteUrl);

  // Validate strategy
  if (!VALID_STRATEGIES.includes(strategy)) {
    throw new Error(
      `Invalid PageSpeed strategy: ${strategy}. ` +
      `Expected "desktop" or "mobile".`
    );
  }

  try {
    const response = await axios.get(PSI_ENDPOINT, {
      params: {
        url: siteUrl,
        strategy,

        // Optional but recommended for production usage
        ...(process.env.GOOGLE_PAGESPEED_API_KEY && {
          key: process.env.GOOGLE_PAGESPEED_API_KEY
        })
      },

      timeout: timeoutMs,

      // Prevent axios from hanging indefinitely
      transitional: {
        clarifyTimeoutError: true
      }
    });

    const lighthouse = response.data?.lighthouseResult;

    if (!lighthouse) {
      throw new Error(
        'PageSpeed Insights response did not contain Lighthouse data'
      );
    }

    const performanceScore =
      lighthouse.categories?.performance?.score ?? null;

    const audits = lighthouse.audits || {};

    return {
      score:
        performanceScore !== null
          ? Math.round(performanceScore * 100)
          : null,

      coreWebVitals: {
        // Largest Contentful Paint
        lcp:
          audits['largest-contentful-paint']?.numericValue ??
          null,

        // Interaction to Next Paint
        inp:
          audits['interaction-to-next-paint']?.numericValue ??
          null,

        // Cumulative Layout Shift
        cls:
          audits['cumulative-layout-shift']?.numericValue ??
          null
      },

      // Keep Lighthouse data available for additional analysis
      raw: lighthouse
    };
  } catch (error) {
    const status = error.response?.status ?? null;

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'PageSpeed Insights request failed';

    const psiError = new Error(message);

    // Custom error information for caller
    psiError.code = 'PSI_FETCH_FAILED';
    psiError.status = status;
    psiError.siteUrl = siteUrl;
    psiError.strategy = strategy;
    psiError.originalError = error;

    throw psiError;
  }
}

module.exports = {
  fetchPsi
};