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
  async simulateWorkflowRun(workflowData, triggerContext = {}) {
    logger.info(TAG, `Starting workflow simulation`);
    
    const nodes = Array.isArray(workflowData.nodes) ? workflowData.nodes : [];
    const edges = Array.isArray(workflowData.edges) ? workflowData.edges : [];
    const variables = workflowData.variables || {};

    const context = {
      isSimulation: true,
      trigger: { ...triggerContext, event: 'simulation_run', payload: { severity: 'Critical', dropPositions: 4 } },
      variables,
      nodeOutputs: {}
    };

    const targetIds = new Set(edges.map(e => e.target));
    let startNodes = nodes.filter(n => !targetIds.has(n.id) || n.type === 'trigger' || n.data?.type === 'trigger');

    if (startNodes.length === 0 && nodes.length > 0) {
      startNodes = [nodes[0]];
    }

    if (startNodes.length === 0) {
      return [{
        nodeId: 'none',
        nodeType: 'info',
        nodeLabel: 'Empty Workflow',
        status: 'Success',
        output: { message: 'Workflow contains no active nodes.' }
      }];
    }

    const trace = [];
    let queue = [...startNodes];
    const visited = new Set();

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || visited.has(node.id)) continue;

      const incomingEdges = edges.filter(e => e.target === node.id);
      const unvisitedDependencies = incomingEdges.filter(e => !visited.has(e.source));
      
      if (unvisitedDependencies.length > 0) continue;

      visited.add(node.id);

      const effectiveType = ((node.data?.type || node.type) || 'action').toLowerCase();
      const nodeLabel = node.data?.label || node.id;

      const step = {
        nodeId: node.id,
        nodeType: effectiveType,
        nodeLabel: nodeLabel,
        status: 'Success',
        output: null
      };

      try {
        if (effectiveType === 'trigger') {
          step.output = {
            triggered: true,
            triggerType: node.data?.subtype || 'event',
            eventPayload: context.trigger.payload
          };
        } else if (effectiveType === 'condition') {
          const conditionExp = node.data?.config?.expression || node.data?.expression || "trigger.payload.severity === 'Critical'";
          let result = true;
          try {
            result = evaluateExpression(conditionExp, context);
          } catch (e) {
            result = true;
          }
          step.output = { result: Boolean(result), branch: result ? 'true' : 'false' };
        } else if (effectiveType === 'ai_agent') {
          const agentKey = node.data?.config?.agentKey || node.data?.subtype || 'seoAuditor';
          step.output = {
            status: 'AI Agent Executed',
            agent: agentKey,
            analysis: `Identified 3 high-impact SEO opportunities and verified SERP volatility.`,
            confidence: 0.94
          };
        } else {
          // Action node
          const rawConfig = node.data?.config || {};
          const actionConfig = executionEngine.resolveVariablesInConfig(rawConfig, context);
          const actionId = node.data?.actionId || node.data?.subtype || 'action_generic';
          
          let module = null;
          try {
            const registry = getActionRegistry();
            module = registry.getAction(actionId) || registry.getAction(`action_${actionId}`);
          } catch (e) {
            module = null;
          }

          if (module && module.simulate) {
            step.output = await module.simulate(actionConfig, context);
          } else {
            step.output = {
              success: true,
              message: `Executed action '${nodeLabel}' successfully in dry-run mode.`,
              config: actionConfig
            };
          }
        }

        context.nodeOutputs[node.id] = step.output;
      } catch (err) {
        step.status = 'Failed';
        step.error = err.message;
        trace.push(step);
        break;
      }

      trace.push(step);

      // Enqueue next downstream nodes
      const outgoingEdges = edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        if (effectiveType === 'condition') {
          const expectedResult = (edge.sourceHandle || edge.label || '').toLowerCase();
          const actualResult = String(context.nodeOutputs[node.id]?.result).toLowerCase();
          if (expectedResult && expectedResult !== actualResult && expectedResult !== 'any') {
            continue;
          }
        }
        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode && !visited.has(nextNode.id)) queue.push(nextNode);
      }
    }

    return trace;
  }
}

module.exports = new AutomationSimulationEngine();
