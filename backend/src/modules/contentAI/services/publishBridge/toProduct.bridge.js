const Product = require('../../../stores/product.model');

function mergeImageAltText(existingImages, altTextUpdates) {
  if (!Array.isArray(altTextUpdates) || !altTextUpdates.length) return existingImages;
  const byUrl = new Map(altTextUpdates.map((u) => [u.url, u.altText]));
  return (existingImages || []).map((img) => (
    byUrl.has(img.url) ? { url: img.url, altText: byUrl.get(img.url) } : img
  ));
}

async function apply(contentPiece, version) {
  const payload = version.payload || {};

  if (!contentPiece.targetId) {
    throw new Error('toProduct.bridge: ContentPiece has no targetId — cannot publish standalone content directly onto a product.');
  }

  const product = await Product.findOne({ _id: contentPiece.targetId, isDeleted: false });
  if (!product) throw new Error('toProduct.bridge: target Product not found');

  const update = {};
  if (payload.description) update.description = payload.description;
  if (payload.shortDescription) update.shortDescription = payload.shortDescription;
  if (Array.isArray(payload.features)) update.features = payload.features;
  if (Array.isArray(payload.specifications)) update.specifications = payload.specifications;
  if (payload.sizeGuide) update.sizeGuide = payload.sizeGuide;
  if (Array.isArray(payload.comparisonPoints)) update.comparisonPoints = payload.comparisonPoints;
  if (Array.isArray(payload.faqs)) update.faqs = payload.faqs;
  if (payload.metaTitle) update.metaTitle = payload.metaTitle;
  if (payload.metaDescription) update.metaDescription = payload.metaDescription;
  if (payload.ogTitle) update.ogTitle = payload.ogTitle;
  if (payload.ogDescription) update.ogDescription = payload.ogDescription;
  if (payload.jsonLd || payload.schemaMarkup) update.schemaMarkup = payload.jsonLd || payload.schemaMarkup;

  // Alt Text Generator output shape: { images: [{ url, altText }] } — merge onto
  // matching image urls rather than replacing the images array wholesale.
  if (Array.isArray(payload.images)) {
    update.images = mergeImageAltText(product.images, payload.images);
  }

  Object.assign(product, update);
  await product.save();
  return product;
}

module.exports = { apply };
