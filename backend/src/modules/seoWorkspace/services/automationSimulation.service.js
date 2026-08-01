const logger = require('../../aiCore/logger.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const { evaluateExpression } = require('./automationExpression.service');
const executionEngine = require('./automationExecution.service');

const TAG = 'AutomationSimulationEngine';

class AutomationSimulationEngine {

  /**
   * Simulates a workflow execution without calling external APIs or saving to the database.
   * Returns a step-by-step trace of the execution path.
   */
  async simulateWorkflowRun(workflowData, triggerContext) {
    logger.info(TAG, `Starting workflow simulation`);
    
    const nodes = workflowData.nodes || [];
    const edges = workflowData.edges || [];
    const variables = workflowData.variables || {};

    const context = {
      isSimulation: true,
      trigger: triggerContext,
      variables,
      nodeOutputs: {}
    };

    const targetIds = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetIds.has(n.id) || n.type === 'trigger');

    if (startNodes.length === 0) {
      throw new Error('No starting nodes found in workflow');
    }

    const trace = [];
    let queue = [...startNodes];
    const visited = new Set();

    while (queue.length > 0) {
      const node = queue.shift();
      if (visited.has(node.id)) continue;

      const incomingEdges = edges.filter(e => e.target === node.id);
      const unvisitedDependencies = incomingEdges.filter(e => !visited.has(e.source));
      
      if (unvisitedDependencies.length > 0) continue;

      visited.add(node.id);

      const step = {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || node.id,
        status: 'Success',
        output: null
      };

      try {
        if (node.type === 'action') {
          // Resolve config but do NOT execute external side effects
          const rawConfig = node.data?.config || {};
          const actionConfig = executionEngine.resolveVariablesInConfig(rawConfig, context);
          const actionId = node.data?.actionId;
          const registry = getActionRegistry();
          const module = registry.getAction(actionId);

          if (!module) throw new Error(`Unknown action: ${actionId}`);

          // In simulation, actions can expose a simulate() method, otherwise we just return success
          if (module.simulate) {
            step.output = await module.simulate(actionConfig, context);
          } else {
            step.output = { message: `Simulated action execution for ${actionId}` };
          }

        } else if (node.type === 'condition') {
          const conditionExp = node.data?.expression;
          const result = evaluateExpression(conditionExp, context);
          step.output = { result };
        }

        context.nodeOutputs[node.id] = step.output;
      } catch (err) {
        step.status = 'Failed';
        step.error = err.message;
        trace.push(step);
        break; // Stop simulation on failure
      }

      trace.push(step);

      // Enqueue next nodes
      const outgoingEdges = edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        if (node.type === 'condition') {
          const expectedResult = edge.sourceHandle || edge.label;
          const actualResult = String(context.nodeOutputs[node.id]?.result);
          if (expectedResult && expectedResult !== actualResult) {
            continue;
          }
        }
        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode) queue.push(nextNode);
      }
    }

    return trace;
  }
}

module.exports = new AutomationSimulationEngine();
