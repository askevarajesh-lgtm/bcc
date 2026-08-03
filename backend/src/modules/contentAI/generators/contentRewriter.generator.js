const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'content-rewriter',
  displayName: 'Content Rewriter',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-rewriter',
  qualityAxes: ['readability', 'grammar', 'aiConfidence'],
  requiredInputFields: ['sourceContent'],
  systemPromptIntro: 'You rewrite existing content to improve clarity, correctness, and flow while preserving '
    + 'its meaning, facts, and approximate length unless told otherwise.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      'Source content to rewrite:',
      inputs.sourceContent,
      inputs.instructions ? `Specific rewrite instructions: ${inputs.instructions}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "rewrittenContent": "", "changeSummary": "" }')
    ].filter(Boolean).join('\n');
  }
};
