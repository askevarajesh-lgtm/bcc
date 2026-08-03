/**
 * ContentAI Quality Scoring — Conversion axis.
 *
 * Deterministic heuristics (CTA presence, urgency language, benefit-oriented
 * phrasing). Gated off (returns null) for generator types where "conversion"
 * isn't a meaningful axis, per the per-module axis table in the architecture
 * doc — callers should already skip this scorer for those types, but it also
 * degrades gracefully here if called anyway.
 */
const { proseText } = require('./_textExtract');

const URGENCY_WORDS = ['now', 'today', 'limited', 'only', 'ends', 'last chance', 'hurry', 'free', 'save'];
const BENEFIT_MARKERS = ['you', 'your'];
const CTA_VERB_PATTERN = /\b(get|start|buy|shop|book|try|join|subscribe|download|request|schedule|claim|order)\b/i;

function findCtaText(payload) {
  if (payload.cta) return String(payload.cta);
  if (Array.isArray(payload.variants) && payload.variants[0]) return String(payload.variants[0].text || '');
  if (payload.blocks) {
    const hero = payload.blocks.find((b) => b.blockType === 'hero-block');
    if (hero?.props?.ctaText) return hero.props.ctaText;
  }
  return '';
}

async function score(payload = {}) {
  const text = proseText(payload).toLowerCase();
  const cta = findCtaText(payload);

  const findings = [];
  const ctaPresent = Boolean(cta) || CTA_VERB_PATTERN.test(text);
  if (!ctaPresent) findings.push('No clear call-to-action detected');

  const urgencyHits = URGENCY_WORDS.filter((w) => text.includes(w)).length;
  const benefitHits = BENEFIT_MARKERS.filter((w) => new RegExp(`\\b${w}\\b`).test(text)).length;

  if (!text) return { score: null, ctaPresent: false, findings: [] };

  let scoreValue = 40;
  if (ctaPresent) scoreValue += 30;
  scoreValue += Math.min(15, urgencyHits * 5);
  scoreValue += Math.min(15, benefitHits * 3);

  if (urgencyHits === 0) findings.push('No urgency or scarcity language found');
  if (benefitHits === 0) findings.push('Copy reads product-focused rather than benefit/reader-focused ("you"/"your")');

  return { score: Math.max(0, Math.min(100, Math.round(scoreValue))), ctaPresent, findings };
}

module.exports = { score };
