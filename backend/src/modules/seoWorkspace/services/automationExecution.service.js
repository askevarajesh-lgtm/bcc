const logger = require('../../aiCore/logger.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const { evaluateExpression } = require('./automationExpression.service');
const AutomationExecutionRun = require('../models/automationExecutionRun.model');
const AutomationExecutionNodeLog = require('../models/automationExecutionNodeLog.model');
const AutomationWorkflowVersion = require('../models/automationWorkflowVersion.model');
const queue = require('../../aiCore/executionQueue.service');

const TAG = 'AutomationExecutionEngine';

class AutomationExecutionEngine {
  
  /**
   * Executes a workflow version
   */
  async executeWorkflowRun(projectId, workflowId, versionId, triggerContext) {
    logger.info(TAG, `Starting workflow execution`, { projectId, workflowId, versionId });
    
    // Create Run Record
    const run = await AutomationExecutionRun.create({
      projectId,
      workflowId,
      versionId,
      triggerContext,
      status: 'Running',
      startTime: new Date()
    });

    try {
      const version = await AutomationWorkflowVersion.findById(versionId).lean();
      if (!version) throw new Error('Workflow version not found');

      const nodes = version.nodes || [];
      const edges = version.edges || [];
      
      const context = {
        projectId,
        workflowId,
        versionId,
        runId: run._id,
        trigger: triggerContext,
        variables: version.variables || {},
        nodeOutputs: {}
      };

      // Identify starting nodes (Trigger nodes or nodes with no incoming edges)
      const targetIds = new Set(edges.map(e => e.target));
      const startNodes = nodes.filter(n => !targetIds.has(n.id) || n.type === 'trigger');

      if (startNodes.length === 0) {
        throw new Error('No starting nodes found in workflow');
      }

      // Execute DAG (simple BFS for now, handling parallel naturally with Promise.all in the future)
      // For this MVP execution engine, we will traverse sequentially or in parallel based on edges.
      await this.traverseDAG(startNodes, nodes, edges, context);

      run.status = 'Succeeded';
      run.endTime = new Date();
      run.durationMs = run.endTime.getTime() - run.startTime.getTime();
      await run.save();

      return run;

    } catch (error) {
      logger.error(TAG, `Workflow execution failed`, { error: error.message, runId: run._id });
      run.status = 'Failed';
      run.error = error.message;
      run.endTime = new Date();
      run.durationMs = run.endTime.getTime() - run.startTime.getTime();
      await run.save();
      throw error;
    }
  }

  async traverseDAG(currentNodes, allNodes, edges, context) {
    let queue = [...currentNodes];
    const visited = new Set();
    const actionRegistry = getActionRegistry();

    while (queue.length > 0) {
      // Allow cancellation Check here
      
      const node = queue.shift();
      if (visited.has(node.id)) continue;
      
      // Check if all incoming dependencies (edges to this node) have been met
      const incomingEdges = edges.filter(e => e.target === node.id);
      const unvisitedDependencies = incomingEdges.filter(e => !visited.has(e.source));
      
      if (unvisitedDependencies.length > 0) {
        // We cannot execute this node yet, wait for dependencies. 
        // It will be queued again when the dependency finishes.
        continue;
      }

      visited.add(node.id);

      // Execute Node
      const log = await AutomationExecutionNodeLog.create({
        executionRunId: context.runId,
        workflowId: context.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        nodeName: node.data?.label || node.type,
        status: 'Started',
        startTime: new Date()
      });

      try {
        let output = null;

        if (node.type === 'action') {
          const actionConfig = node.data?.config || {};
          const actionId = node.data?.actionId;
          const actionModule = actionRegistry.getAction(actionId);
          
          if (!actionModule) {
            throw new Error(`Action module ${actionId} not found`);
          }

          // Evaluate variables in config
          const resolvedConfig = this.resolveVariablesInConfig(actionConfig, context);
          output = await actionModule.execute(resolvedConfig, context);

        } else if (node.type === 'condition') {
          const conditionExp = node.data?.expression;
          const result = evaluateExpression(conditionExp, context);
          output = { result };
          
          // Filter outgoing edges based on condition result (e.g. true/false paths)
          // Handled below during edge enqueueing
        }

        context.nodeOutputs[node.id] = output;
        
        log.status = 'Completed';
        log.outputPayload = output;
        log.endTime = new Date();
        log.durationMs = log.endTime.getTime() - log.startTime.getTime();
        await log.save();

      } catch (err) {
        log.status = 'Failed';
        log.errorDetails = err.message;
        log.endTime = new Date();
        log.durationMs = log.endTime.getTime() - log.startTime.getTime();
        await log.save();
        
        // Node failed, we could trigger compensation here or stop execution
        throw err; 
      }

      // Enqueue next nodes
      const outgoingEdges = edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        // If it's a condition node, check if this edge should be traversed
        if (node.type === 'condition') {
          const expectedResult = edge.sourceHandle || edge.label; // e.g. 'true' or 'false'
          const actualResult = String(context.nodeOutputs[node.id]?.result);
          if (expectedResult && expectedResult !== actualResult) {
            continue; // Skip this branch
          }
        }

        const nextNode = allNodes.find(n => n.id === edge.target);
        if (nextNode) {
          queue.push(nextNode);
        }
      }
    }
  }

  resolveVariablesInConfig(config, context) {
    if (!config) return config;
    if (typeof config === 'string') {
      return evaluateExpression(config, context, true); // true = interpolate string
    }
    if (Array.isArray(config)) {
      return config.map(item => this.resolveVariablesInConfig(item, context));
    }
    if (typeof config === 'object') {
      const resolved = {};
      for (const [k, v] of Object.entries(config)) {
        resolved[k] = this.resolveVariablesInConfig(v, context);
      }
      return resolved;
    }
    return config;
  }
}

module.exports = new AutomationExecutionEngine();
