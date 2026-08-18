/**
 * Resolves which client (User) documents are in scope for an Analytics
 * request. Mirrors the exact tenant filter already used by the real
 * `/brands` endpoint (accounts/brand.controller.js) so "clients" here means
 * the same thing it does everywhere else in the app.
 */
const mongoose = require('mongoose');
const User = require('../../auth/user.model');

const CLIENT_ROLES = ['brand_super_admin', 'brand_manager', 'agency_client'];

async function resolveScope({ agencyId, clientId }) {
  if (clientId && clientId !== 'All Clients') {
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return { scope: 'single', clients: [] };
    }
    const client = await User.findOne({ _id: clientId, agencyId }).select('name ga4PropertyId gscSiteUrl');
    return { scope: 'single', clients: client ? [client] : [] };
  }

  const clients = await User.find({ agencyId, role: { $in: CLIENT_ROLES } })
    .select('name ga4PropertyId gscSiteUrl');

  return { scope: 'all-clients', clients };
}

module.exports = { resolveScope, CLIENT_ROLES };
