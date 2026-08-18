/**
 * AI Core — PageSpeed Insights Provider
 *
 * Normalizes the same `googleapis.com/pagespeedonline/v5` call previously
 * inlined in `seoIntelligence/services/audit.service.js`, but with a bounded
 * timeout and no hardcoded fallback score — a failure here is the caller's
 * signal to fall back to DataForSEO, not something to paper over with a
 * fake number.
 */
const axios = require('axios');

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * 
 * @param {'desktop'|'mobile'} [options.strategy='desktop']
 * @param {number} [options.timeoutMs=12000]
 * @returns {Promise<{ score: number|null, coreWebVitals: { lcp: number|null, fid_or_inp: number|null, cls: number|null }, raw: Object }>}
 */
async function fetchPsi(siteUrl, options = {}) {
  const { strategy = 'desktop', timeoutMs = 12000 } = options;

  const response = await axios.get(PSI_ENDPOINT, {
    params: { url: siteUrl, strategy },
    timeout: timeoutMs
  });

  const lighthouse = response.data?.lighthouseResult;
  const perfCategory = lighthouse?.categories?.performance?.score;
  const audits = lighthouse?.audits || {};

  return {
    score: perfCategory !== undefined && perfCategory !== null ? Math.round(perfCategory * 100) : null,
    coreWebVitals: {
      lcp: audits['largest-contentful-paint']?.numericValue ?? null,
      fid_or_inp: audits['interaction-to-next-paint']?.numericValue ?? audits['max-potential-fid']?.numericValue ?? null,
      cls: audits['cumulative-layout-shift']?.numericValue ?? null
    },
    raw: lighthouse || null
  };
}

module.exports = { fetchPsi };
