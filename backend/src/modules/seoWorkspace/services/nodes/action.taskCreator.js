const WorkspaceTask = require('../../models/workspaceTask.model');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_task_creator',
  
  metadata: () => ({
    id: 'action_task_creator',
    name: 'Create Workspace Task',
    description: 'Creates a formal actionable task in the SEO Workspace approvals/tasks queue',
    category: 'actions',
    icon: 'check-square',
    inputs: ['title', 'description', 'priority', 'category', 'assignedTo', 'dueDate', 'autoApprove'],
    outputs: ['taskId', 'status', 'createdAt']
  }),

  validate: (config) => Boolean(config && config.title),

  execute: async (config, context) => {
    logger.info('Action:TaskCreator', `Creating workspace task: ${config.title} for project ${context.projectId}`);
    
    if (context.isSimulation) {
      return {
        success: true,
        taskId: 'simulated_task_' + Date.now(),
        status: config.autoApprove ? 'Approved' : 'Pending',
        createdAt: new Date()
      };
    }

    try {
      const task = await WorkspaceTask.create({
        projectId: context.projectId,
        title: config.title,
        description: config.description || '',
        priority: config.priority || 'Medium',
        category: config.category || 'Technical',
        assignedTo: config.assignedTo || null,
        status: config.autoApprove ? 'Approved' : 'Pending',
        dueDate: config.dueDate ? new Date(config.dueDate) : null,
        metadata: {
          createdViaAutomation: true,
          workflowId: context.workflowId,
          runId: context.runId
        }
      });

      return {
        success: true,
        taskId: task._id.toString(),
        status: task.status,
        createdAt: task.createdAt
      };
    } catch (err) {
      throw new Error(`Failed to create workspace task: ${err.message}`);
    }
  }
};
