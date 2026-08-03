const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'category-writer',
  displayName: 'Category Writer',
  targetTypes: ['category'],
  agentKey: 'content-category-writer',
  qualityAxes: ['seo', 'readability', 'grammar', 'aiConfidence'],
  requiredInputFields: ['categoryName'],
  systemPromptIntro: 'You are an ecommerce copywriter writing category/collection landing copy: a short '
    + 'introduction and any helpful buying-guide framing, without duplicating individual product descriptions.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Category name: ${inputs.categoryName}`,
      inputs.productExamples ? `Representative products in this category: ${inputs.productExamples}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      '--- Task ---',
      'Write category page intro copy.',
      jsonContract('{ "description": "" }')
    ].filter(Boolean).join('\n');
  }
};
