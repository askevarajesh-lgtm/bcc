const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_sub_workflow',
  
  metadata: () => ({
    id: 'action_sub_workflow',
    name: 'Execute Sub-Workflow',
    description: 'Invokes another published workflow as a modular sub-routine, passing inputs and receiving outputs',
    category: 'logic',
    icon: 'layers',
    inputs: ['subWorkflowId', 'inputVariables', 'waitForCompletion', 'failParentOnError'],
    outputs: ['subRunId', 'subStatus', 'subOutputs', 'durationMs']
  }),

  validate: (config) => Boolean(config && config.subWorkflowId),

  execute: async (config, context) => {
    logger.info('Action:SubWorkflow', `Calling sub-workflow ${config.subWorkflowId} from parent run ${context.runId}`);

    if (context.isSimulation) {
      return {
        success: true,
        subRunId: 'sim_sub_' + Date.now(),
        subStatus: 'Succeeded',
        subOutputs: { result: 'Simulated sub-workflow output' },
        durationMs: 120
      };
    }

    // Lazy load execution service to prevent circular dependencies
    const automationExecutionService = require('../automationExecution.service');
    const startedAt = Date.now();

    try {
      const subRun = await automationExecutionService.runWorkflow(
        context.projectId,
        config.subWorkflowId,
        {
          variables: { ...(context.variables || {}), ...(config.inputVariables || {}) },
          parentRunId: context.runId,
          triggeredBy: 'SubWorkflowNode'
        }
      );

      const durationMs = Date.now() - startedAt;

      return {
        success: subRun.status === 'Succeeded',
        subRunId: subRun._id.toString(),
        subStatus: subRun.status,
        subOutputs: subRun.context?.outputs || {},
        durationMs
      };
    } catch (err) {
      if (config.failParentOnError !== false) {
        throw new Error(`Sub-workflow execution failed: ${err.message}`);
      }
      return {
        success: false,
        subStatus: 'Failed',
        error: err.message,
        durationMs: Date.now() - startedAt
      };
    }
  }
};
