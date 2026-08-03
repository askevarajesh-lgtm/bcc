const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'landing-page-writer',
  displayName: 'Landing Page Writer',
  targetTypes: ['landingPage', 'standalone'],
  agentKey: 'content-landing-page-writer',
  qualityAxes: ['seo', 'readability', 'grammar', 'conversion', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You are a senior conversion-focused landing page copywriter. You write in structured '
    + 'sections (blocks), never raw page HTML, so your output can be dropped directly into a website builder.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Topic / offer: ${inputs.topic}`,
      inputs.keywords ? `Target keywords: ${inputs.keywords}` : '',
      inputs.keyMessage ? `Key message: ${inputs.keyMessage}` : '',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      '--- Task ---',
      'Produce a landing page as an ordered array of content blocks: a hero, 2-4 supporting sections '
      + '(features/benefits/social-proof), and a closing call-to-action section.',
      jsonContract('{ "blocks": [ { "blockType": "hero-block", "props": { "heading": "", "subheading": "", '
        + '"ctaText": "", "ctaHref": "" } }, { "blockType": "feature-grid-block", "props": { "items": '
        + '[ { "icon": "", "title": "", "body": "" } ] } }, { "blockType": "post-faq-section-block", '
        + '"props": { "items": [ { "question": "", "answer": "" } ] } } ] }')
    ].filter(Boolean).join('\n');
  }
};
