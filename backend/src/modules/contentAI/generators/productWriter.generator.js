const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'product-writer',
  displayName: 'Product Writer',
  targetTypes: ['product'],
  agentKey: 'content-product-writer',
  qualityAxes: ['seo', 'readability', 'grammar', 'conversion', 'aiConfidence'],
  requiredInputFields: ['productName'],
  systemPromptIntro: 'You are a senior ecommerce copywriter. You write complete commerce content, not just '
    + 'SEO metadata: long description, short description, feature bullets, specifications, and product FAQs.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Product name: ${inputs.productName}`,
      inputs.keyAttributes ? `Key attributes / specs to cover: ${inputs.keyAttributes}` : '',
      inputs.priceContext ? `Price/positioning context: ${inputs.priceContext}` : '',
      inputs.competitors ? `Known competitors to differentiate against: ${inputs.competitors}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      '--- Task ---',
      'Produce complete commerce content for this product page.',
      jsonContract('{ "description": "", "shortDescription": "", "features": [""], "specifications": '
        + '[ { "label": "", "value": "" } ], "sizeGuide": "", "comparisonPoints": [ { "competitor": "", '
        + '"advantage": "" } ], "faqs": [ { "question": "", "answer": "" } ] }')
    ].filter(Boolean).join('\n');
  }
};
