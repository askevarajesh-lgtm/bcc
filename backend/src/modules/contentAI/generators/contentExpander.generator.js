const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'content-expander',
  displayName: 'Content Expander',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-expander',
  qualityAxes: ['seo', 'readability', 'aiConfidence'],
  requiredInputFields: ['sourceContent'],
  systemPromptIntro: 'You expand existing content with genuinely new, relevant detail (examples, context, '
    + 'sub-points) — never by padding with repetition or filler sentences.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      'Source content to expand:',
      inputs.sourceContent,
      inputs.targetWordCount ? `Target additional length: ~${inputs.targetWordCount} words` : '',
      inputs.focusAreas ? `Areas to expand on: ${inputs.focusAreas}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "expandedContent": "", "addedSections": [""] }')
    ].filter(Boolean).join('\n');
  }
};
