/**
 * ContentAI generator registry — the single source of truth for the 14
 * modules. `contentGeneration.service.js` and the models that need to
 * validate a `generatorType` both import from here so the list only ever
 * exists in one place.
 */
const landingPageWriter = require('./landingPageWriter.generator');
const blogWriter = require('./blogWriter.generator');
const productWriter = require('./productWriter.generator');
const categoryWriter = require('./categoryWriter.generator');
const faqGenerator = require('./faqGenerator.generator');
const metaGenerator = require('./metaGenerator.generator');
const openGraphGenerator = require('./openGraphGenerator.generator');
const schemaGenerator = require('./schemaGenerator.generator');
const altTextGenerator = require('./altTextGenerator.generator');
const ctaGenerator = require('./ctaGenerator.generator');
const internalLinkGenerator = require('./internalLinkGenerator.generator');
const contentRewriter = require('./contentRewriter.generator');
const contentExpander = require('./contentExpander.generator');
const toneOptimizer = require('./toneOptimizer.generator');

const GENERATORS = {
  [landingPageWriter.key]: landingPageWriter,
  [blogWriter.key]: blogWriter,
  [productWriter.key]: productWriter,
  [categoryWriter.key]: categoryWriter,
  [faqGenerator.key]: faqGenerator,
  [metaGenerator.key]: metaGenerator,
  [openGraphGenerator.key]: openGraphGenerator,
  [schemaGenerator.key]: schemaGenerator,
  [altTextGenerator.key]: altTextGenerator,
  [ctaGenerator.key]: ctaGenerator,
  [internalLinkGenerator.key]: internalLinkGenerator,
  [contentRewriter.key]: contentRewriter,
  [contentExpander.key]: contentExpander,
  [toneOptimizer.key]: toneOptimizer
};

const GENERATOR_KEYS = Object.keys(GENERATORS);

function getGenerator(key) {
  const generator = GENERATORS[key];
  if (!generator) {
    throw new Error(`ContentAI: unknown generatorType "${key}". Known keys: ${GENERATOR_KEYS.join(', ')}`);
  }
  return generator;
}

module.exports = { GENERATORS, GENERATOR_KEYS, getGenerator };
