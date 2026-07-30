const toBlog = require('./toBlog.bridge');
const toWebsite = require('./toWebsite.bridge');
const toProduct = require('./toProduct.bridge');
const toCategory = require('./toCategory.bridge');

const BRIDGES = {
  blogPost: toBlog,
  landingPage: toWebsite,
  product: toProduct,
  category: toCategory
};

/**
 * @param {Object} contentPiece - a ContentPiece document (status must already be 'Approved')
 * @param {Object} version - the ContentVersion being published (usually contentPiece.currentVersionId)
 */
async function publish(contentPiece, version) {
  const bridge = BRIDGES[contentPiece.targetType];
  if (!bridge) {
    throw new Error(
      `publishBridge: no bridge registered for targetType "${contentPiece.targetType}" `
      + '(standalone content, e.g. a lone CTA or internal-link suggestion set, is approved for '
      + 'reference/export but has nothing to publish onto directly).'
    );
  }
  return bridge.apply(contentPiece, version);
}

module.exports = { publish, BRIDGES };
