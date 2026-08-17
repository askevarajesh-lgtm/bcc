const { BlogPost } = require('../../../blogs/blog.model');
const { mapBlocksToLayoutJson } = require('../blockMapper.service');

/**
 * Applies an Approved ContentPiece's current version onto its target BlogPost.
 * Only ever called from ContentPiece 'Approved' -> 'Published' — approval
 * alone never touches the live record.
 */
async function apply(contentPiece, version) {
  const payload = version.payload || {};
  const update = {};

  if (payload.title) update.title = payload.title;
  if (payload.excerpt) update.excerpt = payload.excerpt;
  if (payload.metaTitle) update.metaTitle = payload.metaTitle;
  if (payload.metaDescription) update.metaDescription = payload.metaDescription;
  if (payload.ogTitle) update.ogTitle = payload.ogTitle;
  if (payload.ogDescription) update.ogDescription = payload.ogDescription;
  if (payload.jsonLd || payload.schemaMarkup) update.schemaMarkup = payload.jsonLd || payload.schemaMarkup;
  if (Array.isArray(payload.faqs)) update.faqs = payload.faqs;

  if (Array.isArray(payload.blocks) && payload.blocks.length) {
    update.layoutJson = mapBlocksToLayoutJson(payload.blocks);
  }

  if (!contentPiece.targetId) {
    throw new Error('toBlog.bridge: ContentPiece has no targetId — cannot publish standalone content directly onto a blog post.');
  }

  const post = await BlogPost.findOneAndUpdate(
    { _id: contentPiece.targetId, isDeleted: false },
    { $set: update },
    { new: true }
  );
  if (!post) throw new Error('toBlog.bridge: target BlogPost not found');
  return post;
}

module.exports = { apply };
