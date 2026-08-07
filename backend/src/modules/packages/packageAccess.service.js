const Package = require('./package.model');

/**
 * packageAccess.service.js
 * ---------------------------------------------------------------------------
 * Single source of truth for "which Package governs this user's entitlements,
 * and what does that Package allow" -- so this lookup logic isn't duplicated
 * across agency.controller.js, brand.controller.js, integration.controller.js,
 * etc. Anything that needs to know a user's effective package (now, or its
 * `integrations` specifically) should go through this file.
 *
 * TWO INDEPENDENT PERMISSION LAYERS (see integrationAccess.js for the combined
 * check):
 *   Layer 1 -- Company-level availability: does the company actually have the
 *              integration configured at all (an Integration document exists
 *              and is enabled for them)? Governed by the Integration model +
 *              companyIntegrations.js. Unrelated to this file.
 *   Layer 2 -- Package-level entitlement: does the Package assigned to this
 *              company/user *permit* that integration to be used at all,
 *              regardless of whether it's configured? That's what this file
 *              resolves, via `Package.integrations`.
 * An integration should only be usable when BOTH layers say yes.
 * ---------------------------------------------------------------------------
 */

const AGENCY_ROOT_ROLES = ['agency_super_admin', 'commander_admin', 'supreme_super_admin'];
const BRAND_ROOT_ROLES = ['brand_super_admin', 'brand_manager', 'agency_client'];

/**
 * Resolves the "company root" user document -- the one that actually carries
 * `plan` (agency) or `packageName` (brand/direct brand) -- for any given user,
 * including staff users who inherit their company's package via `agencyId` /
 * `brandId`. Mirrors the existing agencyId/brandId conventions already used
 * throughout agency.controller.js and brand.controller.js (e.g.
 * `agencyUser.agencyId = agencyUser._id` is set on the root itself, so staff
 * and the root both resolve consistently through `agencyId`).
 *
 * @param {object} user - a User document (or plain object with at least
 *   role/_id/agencyId/brandId/plan/packageName/isDirect/createdBy)
 * @returns {Promise<object|null>} the company-root user doc, or null
 */
const resolveCompanyUser = async (user) => {
  if (!user) return null;

  const User = require('../auth/user.model');

  // The user IS the company root already (agency admin, or brand/direct-brand
  // record itself) -- no further lookup needed.
  if (AGENCY_ROOT_ROLES.includes(user.role) || BRAND_ROOT_ROLES.includes(user.role)) {
    return user;
  }

  // Staff-type users (agency_manager, plain 'user', etc.) inherit their
  // company's package through whichever root id they carry.
  if (user.agencyId) {
    return User.findById(user.agencyId).lean();
  }
  if (user.brandId) {
    return User.findById(user.brandId).lean();
  }

  // No known company relationship -- nothing to resolve against.
  return null;
};

/**
 * Resolves the Package document that governs a user's (company's) entitlements.
 *   - Agency root      -> Package(type: 'agency') via the `plan` ObjectId ref
 *   - Direct brand      -> Package(type: 'directClient'), matched by name +
 *                          the admin who created it (legacy string-match
 *                          pattern already used in brand.controller.js)
 *   - Agency-owned brand -> Package(type: 'client'), matched by name + agencyId
 *
 * Returns null if no package can be resolved (no plan/packageName set, or the
 * referenced package no longer exists) -- callers should treat that as "no
 * entitlements", not as an error.
 *
 * @param {object} user
 * @returns {Promise<object|null>} lean Package document, or null
 */
const getEffectivePackageForUser = async (user) => {
  const companyUser = await resolveCompanyUser(user);
  if (!companyUser) return null;

  // Agency root: `plan` is a direct ObjectId ref to a Package(type: 'agency').
  if (companyUser.plan) {
    return Package.findOne({ _id: companyUser.plan, type: 'agency' }).lean();
  }

  // Brand-type company: resolved by packageName (same string-match pattern
  // already used at assignment time in brand.controller.js).
  if (companyUser.packageName) {
    if (companyUser.isDirect) {
      return Package.findOne({
        type: 'directClient',
        name: companyUser.packageName,
        createdBy: companyUser.createdBy
      }).lean();
    }
    return Package.findOne({
      type: 'client',
      name: companyUser.packageName,
      agencyId: companyUser.agencyId
    }).lean();
  }

  return null;
};

/**
 * Convenience wrapper: the array of Integration `type` strings the user's
 * effective package entitles them to. Always returns a clean array (never
 * null/undefined), safe to use directly in `.includes(...)` checks.
 *
 * @param {object} user
 * @returns {Promise<string[]>}
 */
const getEffectivePackageIntegrations = async (user) => {
  const pkg = await getEffectivePackageForUser(user);
  return (pkg && Array.isArray(pkg.integrations)) ? pkg.integrations : [];
};

/**
 * Convenience wrapper for the equivalent `features` check, matching the same
 * resolution path as integrations (kept alongside it since both are read off
 * the same effective package, and callers may want either).
 *
 * @param {object} user
 * @returns {Promise<string[]>}
 */
const getEffectivePackageFeatures = async (user) => {
  const pkg = await getEffectivePackageForUser(user);
  return (pkg && Array.isArray(pkg.features)) ? pkg.features : [];
};

module.exports = {
  resolveCompanyUser,
  getEffectivePackageForUser,
  getEffectivePackageIntegrations,
  getEffectivePackageFeatures
};
