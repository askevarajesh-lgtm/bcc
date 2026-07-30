const StoreCollection = require('../../../stores/store-collection.model');

async function apply(contentPiece, version) {
  const payload = version.payload || {};
  const update = {};

  if (payload.description) update.description = payload.description;
  if (payload.metaTitle) update.metaTitle = payload.metaTitle;
  if (payload.metaDescription) update.metaDescription = payload.metaDescription;
  if (payload.ogTitle) update.ogTitle = payload.ogTitle;
  if (payload.ogDescription) update.ogDescription = payload.ogDescription;
  if (payload.jsonLd || payload.schemaMarkup) update.schemaMarkup = payload.jsonLd || payload.schemaMarkup;

  if (!contentPiece.targetId) {
    throw new Error('toCategory.bridge: ContentPiece has no targetId — cannot publish standalone content directly onto a category.');
  }

  const collection = await StoreCollection.findOneAndUpdate(
    { _id: contentPiece.targetId, isDeleted: false },
    { $set: update },
    { new: true }
  );
  if (!collection) throw new Error('toCategory.bridge: target StoreCollection not found');
  return collection;
}

module.exports = { apply };
