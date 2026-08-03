const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'meta-generator',
  displayName: 'Meta Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-meta-generator',
  qualityAxes: ['seo', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You write metaTitle (30-60 characters) and metaDescription (70-160 characters) tags. '
    + 'No keyword stuffing, no restating the title verbatim in the description.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Page/content subject: ${inputs.topic}`,
      inputs.keywords ? `Primary keyword(s): ${inputs.keywords}` : '',
      inputs.existingContent ? `Existing page content for context:\n${inputs.existingContent}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "metaTitle": "", "metaDescription": "" }')
    ].filter(Boolean).join('\n');
  }
};
