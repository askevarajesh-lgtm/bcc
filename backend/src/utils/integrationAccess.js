const { resolveCompanyIntegrations } = require('./companyIntegrations');
const { getEffectivePackageIntegrations, resolveCompanyUser } = require('../modules/packages/packageAccess.service');
const { isSupportedProductIntegration } = require('./supportedIntegrations');

/**
 * @param {object} user - the requesting user (see packageAccess.service.js)
 * @param {object} company - the company/User doc, as already passed into
 *   `resolveCompanyIntegrations()` elsewhere in the codebase
 * @param {string} integrationType - stable Integration `type` value
 * @returns {Promise<boolean>}
 */
const isIntegrationAllowedForUser = async (user, company, integrationType) => {
  if (!integrationType) return false;
  
  if (!isSupportedProductIntegration(integrationType)) {
    return false;
  }

  // Layer 1 -- company-level availability (existing, unchanged utility)
  const companyAllowed = await resolveCompanyIntegrations(company);
  if (!companyAllowed[integrationType]) return false;

  // Layer 2 -- package-level entitlement OR agency additional entitlement
  const packageIntegrations = await getEffectivePackageIntegrations(user);
  const companyUser = await resolveCompanyUser(user);
  
  if (companyUser && ['agency_super_admin', 'commander_admin', 'supreme_super_admin'].includes(companyUser.role)) {
    // Package integrations minus disabled exclusions
    if (packageIntegrations.includes(integrationType)) {
      const disabled = companyUser.disabledPackageIntegrations || [];
      if (disabled.includes(integrationType)) {
        return false;
      }
      return true;
    }

    // Plus additional integrations
    if (Array.isArray(companyUser.additionalIntegrations) && companyUser.additionalIntegrations.includes(integrationType)) {
      return true;
    }
  } else {
    // For other users/clients, preserve basic package entitlement
    if (packageIntegrations.includes(integrationType)) {
      return true;
    }
  }

  return false;
};

module.exports = { isIntegrationAllowedForUser };