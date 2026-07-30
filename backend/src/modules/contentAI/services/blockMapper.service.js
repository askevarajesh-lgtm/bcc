/**
 * ContentAI — Block Mapper.
 *
 * The one place that knows how to turn a generator's `blocks[]` output
 * (§7 of content-ai-platform-architecture.md) into the GrapesJS
 * component-tree shape `websites/page.model.js#layoutJson` expects.
 * `publishBridge/toWebsite.bridge.js` calls this at publish time; the
 * frontend's `BlockPreview.jsx` calls the equivalent client-side mapping
 * for live preview — both consume the same `blocks[]` contract from here.
 *
 * If a `blockType` isn't in this map, that's a registration gap against
 * `frontend/src/pages/WebsiteBuilder/tabs/GrapesJSBuilder.jsx`'s
 * BlockManager, not something this service silently papers over by falling
 * back to raw HTML.
 */

const KNOWN_BLOCK_TYPES = new Set([
  'hero-block',
  'feature-grid-block',
  'post-title-block',
  'post-featured-image-block',
  'post-excerpt-block',
  'post-body-section-block',
  'post-faq-section-block',
  'post-faq-item-block'
]);

function toGjsComponent(block) {
  if (!KNOWN_BLOCK_TYPES.has(block.blockType)) {
    throw new Error(
      `blockMapper: unknown blockType "${block.blockType}" — register it in GrapesJSBuilder.jsx's `
      + 'BlockManager before it can be published, rather than falling back to raw HTML.'
    );
  }

  // GrapesJS component definitions are addressed by their registered block
  // id/type and carry their props under `attributes`/component-specific
  // fields — this mirrors the shape `site-header-block`/`post-*-block`
  // already use in GrapesJSBuilder.jsx (type name + props passed straight
  // through to the block's own component definition).
  return {
    type: block.blockType,
    props: block.props || {}
  };
}

/**
 * @param {Array<{blockType: string, props: Object}>} blocks
 * @returns {Object} a GrapesJS-compatible layoutJson component array, wrapped
 *   the way `Page.layoutJson` stores a single-page GrapesJS project
 */
function mapBlocksToLayoutJson(blocks = []) {
  const components = blocks.map(toGjsComponent);
  return { components };
}

module.exports = { mapBlocksToLayoutJson, KNOWN_BLOCK_TYPES };
