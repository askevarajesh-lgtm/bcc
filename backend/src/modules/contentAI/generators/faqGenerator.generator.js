const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'faq-generator',
  displayName: 'FAQ Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-faq-generator',
  qualityAxes: ['seo', 'readability', 'grammar', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You write concise, genuinely useful FAQ sections that answer real buyer/reader '
    + 'questions — never filler questions with obvious answers.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Subject: ${inputs.topic}`,
      inputs.existingContent ? `Existing page content for context:\n${inputs.existingContent}` : '',
      inputs.count ? `Number of FAQs: ${inputs.count}` : 'Number of FAQs: 5',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "faqs": [ { "question": "", "answer": "" } ] }')
    ].filter(Boolean).join('\n');
  }
};
