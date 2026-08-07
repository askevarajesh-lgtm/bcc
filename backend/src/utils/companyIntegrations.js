const Integration = require('../modules/integrations/integration.model');
const mongoose = require('mongoose');

/**
 * Resolves the integrations that are available for a given company.
 * Query matches platform-level integrations (companyId: null) or company-specific integrations.
 * 
 * @param {string|object} companyOrId - company ID or Company document
 * @returns {Promise<object>} map of {[type]: true} representing available integration types
 */
const resolveCompanyIntegrations = async (companyOrId) => {
  let companyId = companyOrId;
  if (companyOrId && typeof companyOrId === 'object') {
    companyId = companyOrId._id || companyOrId.brandId || companyOrId.agencyId;
  }

  const query = {
    $or: [
      { companyId: null }
    ]
  };

  if (companyId) {
    try {
      const oid = mongoose.Types.ObjectId.isValid(companyId)
        ? new mongoose.Types.ObjectId(companyId)
        : null;
      if (oid) {
        query.$or.push({ companyId: oid });
      }
    } catch (err) {
      // Ignore conversion errors
    }
  }

  // Find all integrations in scope to construct the availability map
  const integrations = await Integration.find(query).lean();

  const allowedMap = {};
  integrations.forEach(i => {
    if (i.type) {
      allowedMap[i.type] = true;
    }
  });

  return allowedMap;
};

module.exports = { resolveCompanyIntegrations };
