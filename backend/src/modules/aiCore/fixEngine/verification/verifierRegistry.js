/**
 * AI Core — Fix Engine — Verifier Registry
 *
 * A category -> recheck-function map. Modules register their own verifier
 * rather than `aiCore` importing every module's agent file directly — this
 * keeps the dependency direction the same as fixEngine.service.js:
 * `seoWorkspace` (and later Blog SEO/Store SEO/etc.) depends on
 * `aiCore/fixEngine`, not the reverse. Concretely: each owning service calls
 * `verifierRegistry.register(category, fn)` once, the same shape
 * `agentLoader`'s `DEFAULT_AGENTS` map already uses for registering agent
 * configs (Architecture Refinements v2 §3).
 *
 * Each registered fn is a thin pointer to a function the *owning* module
 * already exports today — nothing new is written per category, this only
 * wires up what's already there. A recheck fn takes an affected page URL
 * (or, for sitewide findings, the site root) and resolves with whatever raw
 * signal that existing function already returns; `verificationEngine`
 * interprets that signal, this registry only looks it up.
 */
const registry = new Map();

/**
 * @param {string} category - e.g. 'robots_txt', 'canonical_issues'
 * @param {(url: string) => Promise<*>} fn - existing function, re-invoked scoped to one page/site
 */
function register(category, fn) {
  if (!category) throw new Error('verifierRegistry.register: category is required');
  if (typeof fn !== 'function') throw new Error(`verifierRegistry.register: fn for category "${category}" must be a function`);
  registry.set(category, fn);
}

/**
 * @param {string} category
 * @returns {Function|null}
 */
function get(category) {
  return registry.get(category) || null;
}

function has(category) {
  return registry.has(category);
}

function listRegisteredCategories() {
  return Array.from(registry.keys());
}

module.exports = { register, get, has, listRegisteredCategories };
