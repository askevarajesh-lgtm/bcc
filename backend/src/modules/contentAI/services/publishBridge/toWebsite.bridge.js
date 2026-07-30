const Page = require('../../../websites/page.model');
const { mapBlocksToLayoutJson } = require('../blockMapper.service');

async function apply(contentPiece, version) {
  const payload = version.payload || {};
  const update = {};

  if (payload.metaTitle) update.metaTitle = payload.metaTitle;
  if (payload.metaDescription) update.metaDescription = payload.metaDescription;
  if (payload.ogTitle) update.ogTitle = payload.ogTitle;
  if (payload.ogDescription) update.ogDescription = payload.ogDescription;
  if (payload.jsonLd || payload.schemaMarkup) update.schemaMarkup = payload.jsonLd || payload.schemaMarkup;

  if (Array.isArray(payload.blocks) && payload.blocks.length) {
    update.layoutJson = mapBlocksToLayoutJson(payload.blocks);
  }

  if (!contentPiece.targetId) {
    throw new Error('toWebsite.bridge: ContentPiece has no targetId — cannot publish standalone content directly onto a page.');
  }

  const page = await Page.findOneAndUpdate(
    { _id: contentPiece.targetId, isDeleted: false },
    { $set: update },
    { new: true }
  );
  if (!page) throw new Error('toWebsite.bridge: target Page not found');
  return page;
}

module.exports = { apply };
