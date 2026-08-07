const { resolveCompanyIntegrations } = require('./companyIntegrations');
const { getEffectivePackageIntegrations } = require('../modules/packages/packageAccess.service');

/**
 * integrationAccess.js
 * ---------------------------------------------------------------------------
 * Combines the two independent integration-permission layers into a single
 * check. Both must pass for an integration to be usable:
 *
 *   Layer 1 (COMPANY-LEVEL AVAILABILITY) -- does the company actually have
 *     this integration configured/enabled at all? This is unchanged, existing
 *     behavior sourced from `resolveCompanyIntegrations()` (companyIntegrations.js).
 *     It answers: "does this integration exist for this company?"
 *
 *   Layer 2 (PACKAGE-LEVEL ENTITLEMENT) -- does the Package assigned to this
 *     user/company *permit* this integration to be used, independent of
 *     whether it happens to be configured? Sourced from the new
 *     `Package.integrations` field via `getEffectivePackageIntegrations()`.
 *     It answers: "is this company allowed to use this integration?"
 *
 * A company can have an integration configured (Layer 1 true) but still be
 * disallowed from using it if their package doesn't include it (Layer 2
 * false) -- and vice versa, a package can permit an integration the company
 * hasn't configured yet (Layer 1 false), which is also correctly blocked.
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT -- NOT YET WIRED INTO ENFORCEMENT:
 * This helper is intentionally NOT called from integration.controller.js /
 * integration.service.js in this change. Every package that existed before
 * this feature defaults to `integrations: []`, so turning on Layer 2
 * enforcement right now would immediately block every currently-working
 * integration for every existing agency/direct-brand until their packages are
 * explicitly backfilled with the correct entitlements. Wiring this in is a
 * deliberate follow-up step, done once existing packages have been backfilled
 * (or an explicit "legacy package = allow all" fallback is decided).
 * ---------------------------------------------------------------------------
 *
 * @param {object} user - the requesting user (see packageAccess.service.js)
 * @param {object} company - the company/User doc, as already passed into
 *   `resolveCompanyIntegrations()` elsewhere in the codebase
 * @param {string} integrationType - stable Integration `type` value
 * @returns {Promise<boolean>}
 */
const isIntegrationAllowedForUser = async (user, company, integrationType) => {
  if (!integrationType) return false;

  // Layer 1 -- company-level availability (existing, unchanged utility)
  const companyAllowed = resolveCompanyIntegrations(company);
  if (!companyAllowed[integrationType]) return false;

  // Layer 2 -- package-level entitlement (new)
  const packageIntegrations = await getEffectivePackageIntegrations(user);
  if (!packageIntegrations.includes(integrationType)) return false;

  return true;
};

module.exports = { isIntegrationAllowedForUser };
