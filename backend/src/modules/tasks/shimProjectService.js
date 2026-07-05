let projectService = null;

const getService = () => {
  if (!projectService) {
    projectService = require('../projects/project.service');
  }
  return projectService;
};

module.exports = {
  getProject: async (...args) => getService().getProject(...args),
  updateProject: async (...args) => getService().updateProject(...args),
  reconcileProjectTaskCounts: async (...args) => getService().reconcileProjectTaskCounts(...args),
  checkAndMarkProjectCompleted: async (...args) => getService().checkAndMarkProjectCompleted(...args),
  getProjectServiceCapacity: async (...args) => getService().getProjectServiceCapacity(...args),
  projectSupportsServiceType: (...args) => getService().projectSupportsServiceType(...args),
};
