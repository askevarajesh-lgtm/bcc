/**
 * ContentAI generators — shared helpers.
 *
 * Every generator file in this directory builds its prompt out of these
 * three pieces so brand-voice formatting and the JSON-output contract are
 * written once, not 14 times.
 */

function formatBrandVoice(brandVoice) {
  if (!brandVoice) return 'No brand voice profile configured — write in a neutral, professional tone.';
  const lines = [];
  lines.push(`Tone: ${brandVoice.tone?.primary || 'Professional'}${brandVoice.tone?.traits?.length ? ` (${brandVoice.tone.traits.join(', ')})` : ''}`);
  if (brandVoice.audience?.description) lines.push(`Audience: ${brandVoice.audience.description}`);
  if (brandVoice.audience?.painPoints?.length) lines.push(`Audience pain points: ${brandVoice.audience.painPoints.join('; ')}`);
  lines.push(`Language: ${brandVoice.language?.primary || 'en'} (${brandVoice.language?.locale || 'en-US'})`);
  lines.push(`Vocabulary level: ${brandVoice.style?.vocabularyLevel || 'professional'}`);
  lines.push(`Sentence length: ${brandVoice.style?.sentenceLength || 'mixed'}`);
  if (brandVoice.style?.prohibitedWords?.length) lines.push(`Never use these words/phrases: ${brandVoice.style.prohibitedWords.join(', ')}`);
  if (brandVoice.style?.requiredPhrases?.length) lines.push(`Prefer these phrases where natural: ${brandVoice.style.requiredPhrases.join(', ')}`);
  if (brandVoice.style?.exampleSamples?.length) {
    lines.push('Example writing samples to match the voice of:');
    brandVoice.style.exampleSamples.slice(0, 3).forEach((s) => lines.push(`  "${s}"`));
  }
  return lines.join('\n');
}

function jsonContract(shapeDescription) {
  return `Respond with ONLY a single valid JSON object, no markdown fences, no commentary. Shape:\n${shapeDescription}`;
}

module.exports = { formatBrandVoice, jsonContract };
