const WorkspaceStrategy = require('../models/workspaceStrategy.model');
const WorkspaceTask = require('../models/workspaceTask.model');

class PublishGateService {
  /**
   * Validates Gate 1: Strategy Approval
   * Prevents any implementation tasks from proceeding if the strategy is not approved.
   */
  async checkStrategyGate(projectId, strategyId) {
    const strategy = await WorkspaceStrategy.findOne({ _id: strategyId, projectId });
    if (!strategy) {
      throw new Error(`Publish Gate Blocked: No strategy found for project ${projectId}`);
    }
    
    if (strategy.status !== 'Approved') {
      throw new Error(`Publish Gate Blocked: Strategy must be 'Approved' before any implementation can occur. Current status is '${strategy.status}'. Please run validation/approval.`);
    }
    
    return true;
  }

  /**
   * Validates Gate 2: Per-page Edit Approval
   * Prevents specific page changes from going live unless the user has explicitly approved the exact task.
   */
  async checkTaskGate(projectId, taskId) {
    const task = await WorkspaceTask.findOne({ _id: taskId, projectId });
    if (!task) {
      throw new Error(`Publish Gate Blocked: Task ${taskId} not found.`);
    }

    if (task.status !== 'Approved') {
      throw new Error(`Publish Gate Blocked: Cannot publish live edit. Task for ${task.pageUrl} must be explicitly 'Approved'. Current status is '${task.status}'.`);
    }

    return true;
  }
}

module.exports = new PublishGateService();
