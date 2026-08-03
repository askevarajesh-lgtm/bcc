const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'tone-optimizer',
  displayName: 'Tone Optimizer',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-tone-optimizer',
  qualityAxes: ['readability', 'grammar', 'aiConfidence'],
  requiredInputFields: ['sourceContent'],
  systemPromptIntro: 'You adjust the tone of existing content to match a target brand voice, without '
    + 'changing its facts, structure, or meaning.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      'Source content to tone-adjust:',
      inputs.sourceContent,
      '--- Target Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "toneAdjustedContent": "", "changeSummary": "" }')
    ].filter(Boolean).join('\n');
  }
};
