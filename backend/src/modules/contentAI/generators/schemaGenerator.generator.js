const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'schema-generator',
  displayName: 'Schema Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-schema-generator',
  qualityAxes: ['seo', 'aiConfidence'],
  requiredInputFields: ['topic', 'schemaType'],
  systemPromptIntro: 'You produce valid schema.org JSON-LD structured data. Only include properties you can '
    + 'support from the given content — never fabricate ratings, prices, or review counts.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Schema type: ${inputs.schemaType}`,
      `Subject: ${inputs.topic}`,
      inputs.existingContent ? `Existing page content for context:\n${inputs.existingContent}` : '',
      inputs.facts ? `Known facts to include (do not invent beyond these): ${inputs.facts}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "schemaType": "", "jsonLd": { "@context": "https://schema.org", "@type": "" } }')
    ].filter(Boolean).join('\n');
  }
};
