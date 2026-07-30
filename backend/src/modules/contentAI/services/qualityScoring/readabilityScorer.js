/**
 * ContentAI Quality Scoring — Readability axis.
 *
 * Deterministic, no AI call. A Flesch Reading Ease approximation, same
 * word-counting spirit as `blogSeoAgent.service.js#parseBodySignals`
 * (split on whitespace, strip markup) rather than pulling in a new
 * dependency for something this codebase already does inline elsewhere.
 */
const { proseText } = require('./_textExtract');

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith('e') && count > 1) count -= 1;
  return Math.max(1, count);
}

async function score(payload = {}) {
  const text = proseText(payload);
  if (!text || text.split(/\s+/).filter(Boolean).length < 5) {
    return { score: null, gradeLevel: null, findings: ['Not enough prose content to score readability'] };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);

  const fleschScore = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  const clamped = Math.max(0, Math.min(100, Math.round(fleschScore)));

  // Flesch-Kincaid Grade Level, for the UI's "gradeLevel" display
  const gradeLevel = Math.max(0, Math.round((0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59) * 10) / 10);

  const findings = [];
  if (clamped < 40) findings.push('Text reads as difficult — consider shorter sentences and simpler words');
  if (wordCount / sentenceCount > 28) findings.push('Average sentence length is long; consider breaking up long sentences');

  return { score: clamped, gradeLevel, findings };
}

module.exports = { score };
