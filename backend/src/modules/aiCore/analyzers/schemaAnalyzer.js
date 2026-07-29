/**
 * AI Core Analyzers — SchemaAnalyzer
 *
 * Centralizes `extractNodes()`, `validateNode()`, `REQUIRED_PROPS`,
 * `RECOMMENDED_PROPS`, `RICH_RESULT_LABELS` previously only inlined in
 * `seoWorkspace/services/schemaAgent.service.js` — see architecture plan §2.
 * That agent still owns AI-generated schema *proposals* for pages with no
 * existing markup; this analyzer only validates whatever structured data a
 * page already has.
 *
 * Requires the additive `record.jsonLd` field on crawled pages (architecture
 * plan §3) — a page with no `jsonLd` array is treated as having no
 * structured data to validate, not as an error.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');

const NAME = 'SchemaAnalyzer';
const VERSION = '1.0.0';

const REQUIRED_PROPS = {
  Article: ['headline', 'image'],
  BlogPosting: ['headline', 'image'],
  NewsArticle: ['headline', 'image'],
  Product: ['name'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address'],
  WebSite: ['url']
};

const RECOMMENDED_PROPS = {
  Article: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  BlogPosting: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  NewsArticle: ['author', 'publisher', 'datePublished', 'dateModified', 'mainEntityOfPage'],
  Product: ['image', 'description', 'brand', 'sku'],
  Organization: ['logo', 'sameAs'],
  LocalBusiness: ['telephone', 'geo']
};

const RICH_RESULT_LABELS = {
  Article: 'Article rich result',
  BlogPosting: 'Article rich result',
  NewsArticle: 'Article rich result',
  Product: 'Product snippet',
  FAQPage: 'FAQ rich result (note: largely limited to authoritative gov/health sites)',
  HowTo: 'HowTo rich result',
  BreadcrumbList: 'Breadcrumb rich result',
  WebSite: 'Sitelinks search box',
  Organization: 'Knowledge panel / entity signal',
  LocalBusiness: 'Local Business rich result'
};

function isEmptyValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function extractNodes(jsonLd) {
  if (!jsonLd || typeof jsonLd !== 'object') return [];
  if (Array.isArray(jsonLd['@graph'])) return jsonLd['@graph'];
  return [jsonLd];
}

function validateNode(node) {
  const errors = [];
  const warnings = [];
  const richResults = [];

  const rawType = node['@type'];
  const types = (Array.isArray(rawType) ? rawType : [rawType]).filter(Boolean);

  types.forEach((type) => {
    (REQUIRED_PROPS[type] || []).forEach((prop) => {
      if (isEmptyValue(node[prop])) errors.push(`${type}: missing required property "${prop}"`);
    });
    (RECOMMENDED_PROPS[type] || []).forEach((prop) => {
      if (isEmptyValue(node[prop])) warnings.push(`${type}: missing recommended property "${prop}"`);
    });
    if (RICH_RESULT_LABELS[type]) richResults.push(`${type}: ${RICH_RESULT_LABELS[type]}`);

    if (type === 'Product') {
      if (isEmptyValue(node.offers) && isEmptyValue(node.review) && isEmptyValue(node.aggregateRating)) {
        errors.push('Product: must include at least one of "offers", "review", or "aggregateRating"');
      } else if (node.offers && !Array.isArray(node.offers)) {
        ['price', 'priceCurrency', 'availability'].forEach((prop) => {
          if (isEmptyValue(node.offers[prop])) errors.push(`Product.offers: missing required property "${prop}"`);
        });
      }
    }

    if (type === 'FAQPage') {
      const entities = Array.isArray(node.mainEntity) ? node.mainEntity : [];
      entities.forEach((question, i) => {
        if (isEmptyValue(question?.name)) errors.push(`FAQPage.mainEntity[${i}]: missing required property "name"`);
        if (!question?.acceptedAnswer || isEmptyValue(question.acceptedAnswer.text)) {
          errors.push(`FAQPage.mainEntity[${i}]: missing required property "acceptedAnswer.text"`);
        }
      });
    }

    if (type === 'HowTo') {
      const steps = Array.isArray(node.step) ? node.step : [];
      steps.forEach((step, i) => {
        if (isEmptyValue(step?.text)) errors.push(`HowTo.step[${i}]: missing required property "text"`);
      });
    }

    if (type === 'BreadcrumbList') {
      const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
      items.forEach((item, i) => {
        if (isEmptyValue(item?.position)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "position"`);
        if (isEmptyValue(item?.name)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "name"`);
        const isLast = i === items.length - 1;
        if (!isLast && isEmptyValue(item?.item)) errors.push(`BreadcrumbList.itemListElement[${i}]: missing required property "item"`);
      });
    }

    if (type === 'LocalBusiness') {
      const address = node.address || {};
      ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'].forEach((prop) => {
        if (isEmptyValue(address[prop])) errors.push(`LocalBusiness.address: missing required property "${prop}"`);
      });
    }

    if (type === 'WebSite' && node.potentialAction) {
      const action = node.potentialAction;
      if (action['@type'] === 'SearchAction' && !String(action.target || '').includes('{search_term_string}')) {
        errors.push('WebSite.potentialAction: SearchAction "target" must contain "{search_term_string}"');
      }
    }
  });

  return { errors, warnings, richResults };
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
        metrics: { pagesAnalyzed: 0, pagesWithSchema: 0 },
        warnings: ['No indexable pages available to analyze'],
        recommendations: [],
        raw: null,
        metadata: { totalPages: safeArray(pages).length }
      };
    }

    const findings = [];
    let pagesWithSchema = 0;
    let pagesWithNoSchema = 0;
    let errorCount = 0;
    let warningCount = 0;
    const richResultsFound = new Set();

    indexable.forEach((p) => {
      const jsonLdBlocks = safeArray(p.jsonLd);
      if (jsonLdBlocks.length === 0) {
        pagesWithNoSchema++;
        findings.push(finding('info', 'schema_markup', 'Page has no JSON-LD structured data', p.url));
        return;
      }

      pagesWithSchema++;
      jsonLdBlocks.forEach((jsonLd) => {
        const nodes = extractNodes(jsonLd);
        nodes.forEach((node) => {
          if (!node || typeof node !== 'object' || !node['@type']) {
            errorCount++;
            findings.push(finding('warning', 'schema_markup', 'A JSON-LD node is missing "@type"', p.url));
            return;
          }
          const result = validateNode(node);
          result.errors.forEach((msg) => {
            errorCount++;
            findings.push(finding('critical', 'schema_markup', msg, p.url));
          });
          result.warnings.forEach((msg) => {
            warningCount++;
            findings.push(finding('warning', 'schema_markup', msg, p.url));
          });
          result.richResults.forEach((label) => richResultsFound.add(label));
        });
      });
    });

    const total = indexable.length;
    const weightedIssues = errorCount * 2 + warningCount * 0.5 + pagesWithNoSchema * 0.5;
    const score = Math.max(0, 100 - (weightedIssues / total) * 10);

    const recommendations = [];
    if (pagesWithNoSchema > 0) recommendations.push(`Add structured data to ${pagesWithNoSchema} page(s) with none`);
    if (errorCount > 0) recommendations.push(`Fix ${errorCount} schema validation error(s) (missing required properties)`);

    return {
      source: 'crawl',
      score,
      findings,
      metrics: {
        pagesAnalyzed: total,
        pagesWithSchema,
        pagesWithNoSchema,
        errorCount,
        warningCount,
        richResultEligibility: Array.from(richResultsFound)
      },
      warnings: [],
      recommendations,
      raw: null,
      metadata: { totalPages: safeArray(pages).length }
    };
  });
}

module.exports = { run, NAME, VERSION, extractNodes, validateNode };
