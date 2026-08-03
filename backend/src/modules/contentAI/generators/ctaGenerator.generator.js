const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'cta-generator',
  displayName: 'CTA Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-cta-generator',
  qualityAxes: ['conversion', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You write short, action-oriented call-to-action variants (2-6 words each) that create '
    + 'urgency or clarify value without generic filler like "Click Here" or "Learn More" alone.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Offer / page subject: ${inputs.topic}`,
      inputs.goal ? `Conversion goal: ${inputs.goal}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      jsonContract('{ "variants": [ { "text": "", "rationale": "" } ] }')
    ].filter(Boolean).join('\n');
  }
};
