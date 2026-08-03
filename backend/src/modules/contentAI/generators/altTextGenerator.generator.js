const { jsonContract } = require('./_shared');

module.exports = {
  key: 'alt-text-generator',
  displayName: 'Alt Text Generator',
  targetTypes: ['landingPage', 'blogPost', 'product', 'category', 'standalone'],
  agentKey: 'content-alt-text-generator',
  qualityAxes: ['seo', 'readability', 'aiConfidence'],
  requiredInputFields: ['images'],
  systemPromptIntro: 'You write concise, descriptive, accessibility-first alt text (under 125 characters '
    + 'each) for images. Describe what is actually in the image; do not keyword-stuff.',
  buildUserPrompt(inputs) {
    const images = Array.isArray(inputs.images) ? inputs.images : [];
    return [
      `Subject/page context: ${inputs.topic || 'n/a'}`,
      'Images (url + any available filename/caption context):',
      ...images.map((img, i) => `${i + 1}. url: ${img.url}${img.context ? `, context: ${img.context}` : ''}`),
      jsonContract('{ "images": [ { "url": "", "altText": "" } ] }')
    ].filter(Boolean).join('\n');
  }
};
