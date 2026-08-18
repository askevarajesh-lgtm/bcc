const mongoose = require('mongoose');
const AnalyticsProject = require('../models/analyticsProject.model');

/**
 * Resolves which AnalyticsProject documents are in scope for an Analytics
 * request based on the selected projectId or agencyId.
 */
async function resolveScope({ agencyId, projectId }) {
  if (projectId && projectId !== 'All Clients' && projectId !== 'All Domains' && projectId !== 'undefined') {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return { scope: 'single', projects: [] };
    }
    const project = await AnalyticsProject.findOne({ _id: projectId, isDeleted: false });
    // Make sure agency/company has access to this project
    if (project && (String(project.companyId) === String(agencyId) || String(project.createdBy) === String(agencyId) || String(project.clientId) === String(agencyId))) {
      return { scope: 'single', projects: [project] };
    }
    // If the agencyId is actually the project's companyId/clientId, it's fine.
    return { scope: 'single', projects: project ? [project] : [] };
  }

  // Get all active projects for this agency/company
  const projects = await AnalyticsProject.find({ 
    $or: [{ companyId: agencyId }, { createdBy: agencyId }, { clientId: agencyId }],
    isDeleted: false 
  });

  return { scope: 'all-projects', projects };
}

module.exports = { resolveScope };
