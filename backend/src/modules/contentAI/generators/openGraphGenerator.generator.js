const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'open-graph-generator',
  displayName: 'Open Graph Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-og-generator',
  qualityAxes: ['seo', 'conversion', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You write Open Graph title/description tags optimized for social-share click-through '
    + '(more inviting/curiosity-driven than a search meta description, but never clickbait or misleading), '
    + 'plus a short image-generation brief for the og:image.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Page/content subject: ${inputs.topic}`,
      inputs.existingContent ? `Existing page content for context:\n${inputs.existingContent}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "ogTitle": "", "ogDescription": "", "ogImagePrompt": "" }')
    ].filter(Boolean).join('\n');
  }
};
