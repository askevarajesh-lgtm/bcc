const SUPPORTED_TYPES = new Set([
  'FAQPage', 'Article', 'BlogPosting', 'Product', 'Service', 'Organization', 
  'Person', 'LocalBusiness', 'Review', 'AggregateRating', 'Event', 'BreadcrumbList', 
  'VideoObject', 'HowTo', 'WebSite', 'WebPage'
]);

const REQUIRED_PROPERTIES = {
  'FAQPage': ['mainEntity'],
  'Article': ['headline', 'author', 'datePublished', 'image'],
  'BlogPosting': ['headline', 'author', 'datePublished', 'image'],
  'Product': ['name', 'description', 'image', 'offers', 'review', 'aggregateRating'],
  'Service': ['name', 'provider'],
  'Organization': ['name', 'url', 'logo'],
  'Person': ['name'],
  'LocalBusiness': ['name', 'address', 'telephone', 'image'],
  'Review': ['author', 'itemReviewed', 'reviewRating'],
  'AggregateRating': ['ratingValue', 'reviewCount'],
  'Event': ['name', 'startDate', 'location'],
  'BreadcrumbList': ['itemListElement'],
  'VideoObject': ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  'HowTo': ['name', 'step'],
  'WebSite': ['name', 'url'],
  'WebPage': ['name']
};

class SchemaValidatorService {
  /**
   * Validates an array of JSON-LD objects extracted from a page.
   * @param {Array} jsonLdArray 
   * @returns {Object} { valid: boolean, issues: Array }
   */
  static validate(jsonLdArray) {
    if (!Array.isArray(jsonLdArray) || jsonLdArray.length === 0) {
      return { valid: true, issues: [] }; // No schema is technically valid (unless missing completely, which is an SEO warning, not a schema validation error)
    }

    const issues = [];
    let isValid = true;
    const typeCount = new Map();

    const checkNode = (node) => {
      if (!node || typeof node !== 'object') return;

      const typeRaw = node['@type'];
      const types = Array.isArray(typeRaw) ? typeRaw : [typeRaw];

      types.forEach(type => {
        if (!type) return;

        // Keep track of counts for duplicate checking
        typeCount.set(type, (typeCount.get(type) || 0) + 1);

        if (!SUPPORTED_TYPES.has(type)) {
          // It's not one of our targeted rich result types, but it could be valid schema.org. 
          // We don't mark as error, maybe just ignore or info.
          return;
        }

        const required = REQUIRED_PROPERTIES[type] || [];
        const missing = [];

        required.forEach(prop => {
          if (node[prop] === undefined || node[prop] === null || node[prop] === '') {
            missing.push(prop);
          }
        });

        if (missing.length > 0) {
          isValid = false;
          issues.push({
            type,
            severity: 'error',
            message: `Missing required properties for Rich Results: ${missing.join(', ')}`
          });
        }
      });

      // Recurse for nested objects (very basic nesting check)
      Object.keys(node).forEach(key => {
        if (key !== '@type' && key !== '@context') {
          if (Array.isArray(node[key])) {
            node[key].forEach(item => {
              if (item && typeof item === 'object') checkNode(item);
            });
          } else if (node[key] && typeof node[key] === 'object') {
            checkNode(node[key]);
          }
        }
      });
    };

    // Flatten graph if necessary
    const flatNodes = [];
    jsonLdArray.forEach(block => {
      if (block['@graph'] && Array.isArray(block['@graph'])) {
        flatNodes.push(...block['@graph']);
      } else {
        flatNodes.push(block);
      }
    });

    flatNodes.forEach(node => checkNode(node));

    // Check duplicates
    typeCount.forEach((count, type) => {
      if (count > 1 && ['FAQPage', 'WebSite', 'Organization', 'LocalBusiness'].includes(type)) {
        issues.push({
          type,
          severity: 'warning',
          message: `Duplicate schema found: ${count} instances of ${type}. Search engines prefer a single unified entity.`
        });
      }
    });

    return {
      valid: isValid,
      issues
    };
  }
}

module.exports = SchemaValidatorService;
