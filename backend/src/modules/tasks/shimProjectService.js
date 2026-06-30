
module.exports = {
  getProject: async () => null,
  updateProject: async () => null,
  reconcileProjectTaskCounts: async () => null,
  checkAndMarkProjectCompleted: async () => null,
  getProjectServiceCapacity: async () => ({ remaining: 1, total: 1, assigned: 0 }),
  projectSupportsServiceType: () => true,
};
