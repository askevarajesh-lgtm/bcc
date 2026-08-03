/**
 * AI Core Analyzers — ImageAnalyzer
 *
 * Centralizes `extractFilename()`, `baseName()`, `isGenericFilename()`,
 * `isGenericAlt()`, `GENERIC_ALT_VALUES`, `GENERIC_FILENAME_PATTERNS`,
 * previously only inlined in `seoWorkspace/services/imageSeoAgent.service.js`
 * — see architecture plan §2. That agent still owns AI-generated alt-text/
 * filename-slug *proposals*; this analyzer only reports the objective,
 * code-measured image-hygiene state (missing alt, generic alt, generic
 * filename, missing dimensions, no lazy-loading).
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');

const NAME = 'ImageAnalyzer';
const VERSION = '1.0.0';

const GENERIC_ALT_VALUES = new Set(['image', 'photo', 'picture', 'graphic', 'img', 'untitled', 'placeholder']);

const GENERIC_FILENAME_PATTERNS = [
  /^img[-_]?\d+$/i,
  /^dsc[-_]?\d+$/i,
  /^screenshot[-_ ]?\d*/i,
  /^image[-_]?\d*$/i,
  /^photo[-_]?\d*$/i,
  /^\d{6,}$/, // bare long numeric hash
  /^[a-f0-9]{16,}$/i // hex hash
];

function extractFilename(src) {
  try {
    const u = new URL(src);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last);
  } catch (error) {
    const parts = String(src).split('?')[0].split('/');
    return parts[parts.length - 1] || '';
  }
}

function baseName(filename) {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(0, idx) : filename;
}

function isGenericFilename(filename) {
  if (!filename) return false;
  const base = baseName(filename);
  if (/[\s()]/.test(filename)) return true;
  return GENERIC_FILENAME_PATTERNS.some((re) => re.test(base));
}

function isGenericAlt(alt, filename) {
  if (!alt) return false; // handled by missingAlt separately
  const normalized = alt.trim().toLowerCase();
  if (GENERIC_ALT_VALUES.has(normalized)) return true;
  const base = baseName(filename || '').toLowerCase();
  const normalizedBase = base.replace(/[-_]+/g, ' ').trim();
  return normalizedBase.length > 0 && normalized === normalizedBase;
}

function finding(severity, category, message, pageUrl) {
  return { severity, category, message, pageUrl };
}

async function run(pages) {
  return withAnalyzerContract(NAME, VERSION, async () => {
    const indexable = safeArray(pages).filter((p) => p.status === 200 && p.indexable !== false);

    if (indexable.length === 0) {
      return {
        source: 'crawl',
        score: 0,
        findings: [],
        metrics: { pagesAnalyzed: 0, imagesAnalyzed: 0 },
        warnings: ['No indexable pages available to analyze'],
        recommendations: [],
        raw: null,
        metadata: { totalPages: safeArray(pages).length }
      };
    }

    const findings = [];
    const counts = { missingAlt: 0, genericAlt: 0, genericFilename: 0, missingDimensions: 0, noLazyLoading: 0 };
    let imagesAnalyzed = 0;

    indexable.forEach((p) => {
      safeArray(p.images).forEach((img) => {
        imagesAnalyzed++;
        const filename = extractFilename(img.src);
        const alt = (img.alt || '').trim();

        if (!alt) {
          counts.missingAlt++;
          findings.push(finding('critical', 'image_seo', `Image missing alt text: ${filename || img.src}`, p.url));
        } else if (isGenericAlt(alt, filename)) {
          counts.genericAlt++;
          findings.push(finding('warning', 'image_seo', `Image has generic/unhelpful alt text: "${alt}"`, p.url));
        }

        if (isGenericFilename(filename)) {
          counts.genericFilename++;
          findings.push(finding('info', 'image_seo', `Image has a generic, non-descriptive filename: "${filename}"`, p.url));
        }

        if (!img.width || !img.height) {
          counts.missingDimensions++;
          findings.push(finding('info', 'image_seo', `Image missing width/height attributes (CLS risk): ${filename || img.src}`, p.url));
        }

        if (!img.loading) {
          counts.noLazyLoading++;
        }
      });
    });

    const total = imagesAnalyzed || 1;
    const weightedIssues = counts.missingAlt * 3 + counts.genericAlt + counts.genericFilename + counts.missingDimensions;
    const score = imagesAnalyzed === 0 ? 100 : Math.max(0, 100 - (weightedIssues / total) * 10);

    const recommendations = [];
    if (counts.missingAlt > 0) recommendations.push(`Add alt text to ${counts.missingAlt} image(s) missing it`);
    if (counts.genericAlt > 0) recommendations.push(`Rewrite ${counts.genericAlt} generic alt-text value(s) to be descriptive`);
    if (counts.genericFilename > 0) recommendations.push(`Rename ${counts.genericFilename} image(s) with generic filenames to descriptive, hyphenated slugs`);
    if (counts.missingDimensions > 0) recommendations.push(`Add explicit width/height to ${counts.missingDimensions} image(s) to prevent layout shift`);

    return {
      source: 'crawl',
      score,
      findings,
      metrics: { pagesAnalyzed: indexable.length, imagesAnalyzed, ...counts },
      warnings: [],
      recommendations,
      raw: null,
      metadata: { totalPages: safeArray(pages).length }
    };
  });
}

module.exports = { run, NAME, VERSION, extractFilename, baseName, isGenericFilename, isGenericAlt };
