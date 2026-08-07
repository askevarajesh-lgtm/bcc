const { resolveCompanyIntegrations } = require('./companyIntegrations');
const { getEffectivePackageIntegrations } = require('../modules/packages/packageAccess.service');

/**
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