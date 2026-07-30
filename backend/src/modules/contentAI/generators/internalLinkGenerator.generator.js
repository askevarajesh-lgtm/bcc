const { jsonContract } = require('./_shared');

module.exports = {
  key: 'internal-link-generator',
  displayName: 'Internal Link Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-internal-link-generator',
  qualityAxes: ['seo', 'aiConfidence'],
  requiredInputFields: ['existingContent', 'candidateLinks'],
  systemPromptIntro: 'You suggest internal links from a piece of content to OTHER EXISTING pages on the same '
    + 'site. Only ever suggest a target from the provided candidate list — never invent a URL.',
  buildUserPrompt(inputs) {
    const candidates = Array.isArray(inputs.candidateLinks) ? inputs.candidateLinks : [];
    return [
      'Content to link from:',
      inputs.existingContent,
      'Candidate link targets (choose only from this list):',
      ...candidates.map((c, i) => `${i + 1}. ${c.title} — ${c.url}`),
      jsonContract('{ "suggestions": [ { "anchorText": "", "targetUrl": "", "rationale": "" } ] }')
    ].filter(Boolean).join('\n');
  }
};
