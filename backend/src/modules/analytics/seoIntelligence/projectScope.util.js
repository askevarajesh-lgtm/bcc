/**
 * Resolves the real `WorkspaceProject` documents in scope for an Analytics
 * request, so the SEO Intelligence dashboards read the exact same projects
 * that Website Audit / Technical SEO / Keyword Intelligence / Rank Tracking
 * / AEO / GEO / Automation & Monitoring / Competitor Intelligence show in
 * the SEO Workspace itself.
 *
 * `WorkspaceProject.companyId` is the agency, `WorkspaceProject.clientId`
 * is the client — same tenant shape as everywhere else in this module,
 * just named `companyId` on that particular collection.
 */
const mongoose = require('mongoose');
const WorkspaceProject = require('../../seoWorkspace/models/workspaceProject.model');

/**
 * @param {Object} params
 * @param {string} params.agencyId
 * @param {string|null} params.clientId - a specific client id, or null/'All Clients' for agency-wide
 * @param {Array<{_id:any}>} params.clients - the same client list `clientScope.service` resolved for GA4/GSC/CRM, so every data source in the dashboard is scoped to an identical client set
 */
async function resolveProjects({ agencyId, clientId, clients }) {
  const filter = { companyId: agencyId, isDeleted: false };

  if (clientId && clientId !== 'All Clients' && mongoose.Types.ObjectId.isValid(clientId)) {
    filter.clientId = clientId;
  } else if (Array.isArray(clients) && clients.length > 0) {
    filter.clientId = { $in: clients.map(c => c._id) };
  } else {
    // No specific client and no resolved client list — nothing is in scope.
    return [];
  }

  const projects = await WorkspaceProject.find(filter).select('_id clientId domain name').lean();
  return projects;
}

module.exports = { resolveProjects };
