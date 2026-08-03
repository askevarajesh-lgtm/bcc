const logger = require('../../aiCore/logger.service');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { getActionRegistry } = require('./automationActionRegistry.service');

const TAG = 'AutomationValidationEngine';

class AutomationValidationEngine {

  /**
   * Validates a workflow definition.
   * @param {Object} workflowData - { nodes, edges }
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(workflowData) {
    const { nodes = [], edges = [] } = workflowData;
    const errors = [];

    if (nodes.length === 0) {
      errors.push('Workflow must contain at least one node.');
      return { isValid: false, errors };
    }

    // 1. Check for exactly one or more Trigger nodes
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must contain at least one Trigger node.');
    }

    // 2. Detect orphan nodes (nodes with no incoming or outgoing edges, except single node workflows)
    if (nodes.length > 1) {
      const edgeSources = new Set(edges.map(e => e.source));
      const edgeTargets = new Set(edges.map(e => e.target));
      
      for (const node of nodes) {
        if (!edgeSources.has(node.id) && !edgeTargets.has(node.id)) {
          errors.push(`Node "${node.data?.label || node.id}" is orphaned (not connected).`);
        }
      }
    }

    // 3. Detect circular dependencies (Cycles)
    if (this.hasCycles(nodes, edges)) {
      errors.push('Workflow contains circular dependencies (cycles are not allowed).');
    }

    // 4. Validate Node Configurations via Registries
    const triggerRegistry = getTriggerRegistry();
    const actionRegistry = getActionRegistry();

    for (const node of nodes) {
      if (node.type === 'trigger') {
        const triggerModule = triggerRegistry.getTrigger(node.data?.triggerId);
        if (triggerModule && triggerModule.validate) {
          const valid = triggerModule.validate(node.data?.config);
          if (!valid) errors.push(`Trigger node "${node.data?.label || node.id}" has invalid configuration.`);
        }
      } else if (node.type === 'action') {
        const actionModule = actionRegistry.getAction(node.data?.actionId);
        if (!actionModule) {
          errors.push(`Action node "${node.data?.label || node.id}" has unknown action type "${node.data?.actionId}".`);
        } else if (actionModule.validate) {
          const valid = actionModule.validate(node.data?.config);
          if (!valid) errors.push(`Action node "${node.data?.label || node.id}" has invalid configuration.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  hasCycles(nodes, edges) {
    const graph = {};
    nodes.forEach(n => graph[n.id] = []);
    edges.forEach(e => {
      if (graph[e.source]) {
        graph[e.source].push(e.target);
      }
    });

    const visited = new Set();
    const recursionStack = new Set();

    const isCyclic = (nodeId) => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const neighbors = graph[nodeId] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && isCyclic(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (isCyclic(node.id)) return true;
    }

    return false;
  }
}

module.exports = new AutomationValidationEngine();
