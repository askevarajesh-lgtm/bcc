const { formatBrandVoice, jsonContract } = require('./_shared');

module.exports = {
  key: 'blog-writer',
  displayName: 'Blog Writer',
  targetTypes: ['blogPost', 'standalone'],
  agentKey: 'content-blog-writer',
  qualityAxes: ['seo', 'readability', 'grammar', 'conversion', 'aiConfidence'],
  requiredInputFields: ['topic'],
  systemPromptIntro: 'You are a senior SEO content writer producing long-form blog posts with correct '
    + 'heading structure (a single H1, logically nested H2/H3) and no keyword stuffing.',
  buildUserPrompt(inputs, brandVoice) {
    return [
      `Topic: ${inputs.topic}`,
      inputs.keywords ? `Target keywords: ${inputs.keywords}` : '',
      inputs.targetWordCount ? `Target length: ~${inputs.targetWordCount} words` : 'Target length: ~900-1200 words',
      '--- Brand Voice ---',
      formatBrandVoice(brandVoice),
      '--- Task ---',
      'Write a complete blog post as a block array (title block, body sections with h2/h3 headings, '
      + 'an excerpt, and an optional FAQ section).',
      jsonContract('{ "title": "", "excerpt": "", "blocks": [ { "blockType": "post-title-block", "props": '
        + '{ "heading": "" } }, { "blockType": "post-body-section-block", "props": { "headingLevel": "h2", '
        + '"heading": "", "body": "" } }, { "blockType": "post-faq-section-block", "props": { "items": '
        + '[ { "question": "", "answer": "" } ] } } ] }')
    ].filter(Boolean).join('\n');
  }
};
