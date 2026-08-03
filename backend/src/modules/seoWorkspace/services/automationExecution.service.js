const logger = require('../../aiCore/logger.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { evaluateExpression } = require('./automationExpression.service');
const AutomationWorkflow = require('../models/automationWorkflow.model');
const AutomationExecutionRun = require('../models/automationExecutionRun.model');
const AutomationExecutionNodeLog = require('../models/automationExecutionNodeLog.model');
const AutomationWorkflowVersion = require('../models/automationWorkflowVersion.model');

const TAG = 'AutomationExecutionEngine';

class AutomationExecutionEngine {
  /**
   * Universal runner for a workflow
   */
  async runWorkflow(projectId, workflowId, triggerContext = {}) {
    const workflow = await AutomationWorkflow.findOne({ _id: workflowId, projectId });
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found in project ${projectId}`);
    }

    let versionId = triggerContext.versionId || workflow.activeVersionId;
    if (!versionId) {
      const latestVersion = await AutomationWorkflowVersion.findOne({ workflowId }).sort({ versionNumber: -1 });
      if (!latestVersion) throw new Error('No workflow version available to execute');
      versionId = latestVersion._id;
    }

    return this.executeWorkflowRun(projectId, workflowId, versionId, triggerContext);
  }

  /**
   * Executes a workflow version DAG
   */
  async executeWorkflowRun(projectId, workflowId, versionId, triggerContext = {}) {
    logger.info(TAG, `Starting enterprise workflow execution`, { projectId, workflowId, versionId });
    
    // Create Run Record
    const run = await AutomationExecutionRun.create({
      projectId,
      workflowId,
      versionId,
      triggerContext,
      status: 'Running',
      startTime: new Date()
    });

    const compensationStack = [];

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
        variables: { ...(version.variables || {}), ...(triggerContext.variables || {}) },
        nodeOutputs: {},
        compensationStack
      };

      if (nodes.length === 0) {
        throw new Error('Workflow version contains no nodes');
      }

      // Identify starting nodes (Trigger nodes or nodes with no incoming edges)
      const targetIds = new Set(edges.map(e => e.target));
      let startNodes = nodes.filter(n => !targetIds.has(n.id) || n.type === 'trigger');

      if (startNodes.length === 0) {
        startNodes = [nodes[0]];
      }

      // Execute DAG
      await this.traverseDAG(startNodes, nodes, edges, context);

      run.status = 'Succeeded';
      run.endTime = new Date();
      run.durationMs = run.endTime.getTime() - run.startTime.getTime();
      run.result = { outputs: context.nodeOutputs };
      await run.save();

      return run;

    } catch (error) {
      logger.error(TAG, `Workflow execution failed`, { error: error.message, runId: run._id });
      
      // Execute compensation stack if any
      if (compensationStack.length > 0) {
        await this._runCompensations(compensationStack, projectId, run._id);
      }

      run.status = 'Failed';
      run.error = error.message;
      run.endTime = new Date();
      run.durationMs = run.endTime.getTime() - run.startTime.getTime();
      await run.save();
      throw error;
    }
  }

  async traverseDAG(startNodes, allNodes, edges, context) {
    const queue = [...startNodes];
    const visited = new Set();
    const actionRegistry = getActionRegistry();
    const triggerRegistry = getTriggerRegistry();

    while (queue.length > 0) {
      const node = queue.shift();
      if (visited.has(node.id)) continue;
      
      // Check incoming dependencies
      const incomingEdges = edges.filter(e => e.target === node.id);
      const unvisitedDependencies = incomingEdges.filter(e => !visited.has(e.source));
      
      if (unvisitedDependencies.length > 0) {
        continue;
      }

      visited.add(node.id);

      // Create live node execution log
      const log = await AutomationExecutionNodeLog.create({
        executionRunId: context.runId,
        workflowId: context.workflowId,
        nodeId: node.id,
        nodeType: node.type || 'action',
        nodeName: node.data?.label || node.data?.name || node.type,
        status: 'Started',
        startTime: new Date(),
        inputPayload: node.data?.config || {}
      });

      let output = null;
      let nodeError = null;

      try {
        const nodeType = (node.type || '').toLowerCase();
        const actionId = node.data?.actionId || node.data?.type || node.id;
        const resolvedConfig = this.resolveVariablesInConfig(node.data?.config || {}, context);

        if (nodeType === 'trigger') {
          output = { success: true, triggered: true, data: context.trigger };
        } else if (nodeType === 'condition' || actionId === 'action_condition') {
          const conditionModule = actionRegistry.getAction('action_condition');
          output = await conditionModule.execute(resolvedConfig, context);
        } else if (nodeType === 'switch' || actionId === 'action_switch') {
          const switchModule = actionRegistry.getAction('action_switch');
          output = await switchModule.execute(resolvedConfig, context);
        } else {
          // General Action / Logic execution
          let actionModule = actionRegistry.getAction(actionId);
          if (!actionModule) {
            // Fallback match by short ID
            actionModule = actionRegistry.getAction(`action_${actionId}`);
          }

          if (!actionModule) {
            logger.warn(TAG, `Action module '${actionId}' not registered, evaluating as generic step`);
            output = { success: true, executed: true, data: resolvedConfig };
          } else {
            // Execute with retry support
            let attempts = 0;
            const maxRetries = Number(node.data?.retryCount) || 1;
            let delayMs = 1000;

            while (attempts < maxRetries) {
              try {
                output = await actionModule.execute(resolvedConfig, context);
                break;
              } catch (retryErr) {
                attempts++;
                if (attempts < maxRetries) {
                  log.status = 'Retrying';
                  log.message = `Attempt ${attempts} failed: ${retryErr.message}. Retrying in ${delayMs}ms...`;
                  await log.save();
                  await new Promise(r => setTimeout(r, delayMs));
                  delayMs *= 2;
                } else {
                  throw retryErr;
                }
              }
            }
          }
        }

        context.nodeOutputs[node.id] = output;
        
        // Merge output variables into global execution context if structured
        if (output && typeof output === 'object') {
          Object.assign(context.variables, output);
        }

        log.status = 'Completed';
        log.outputPayload = output;
        log.endTime = new Date();
        log.durationMs = log.endTime.getTime() - log.startTime.getTime();
        await log.save();

      } catch (err) {
        nodeError = err;
        log.status = 'Failed';
        log.errorDetails = err.message;
        log.endTime = new Date();
        log.durationMs = log.endTime.getTime() - log.startTime.getTime();
        await log.save();

        // Check if node has an error boundary or continueOnError flag
        if (node.data?.continueOnError) {
          logger.warn(TAG, `Node ${node.id} failed but continueOnError is true. Continuing...`);
          context.nodeOutputs[node.id] = { hasError: true, error: err.message };
        } else {
          throw err;
        }
      }

      // Enqueue next downstream nodes
      const outgoingEdges = edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        // Condition / Switch port routing
        if (output && output.branch) {
          const targetPort = edge.sourceHandle || edge.label;
          if (targetPort && targetPort !== output.branch) {
            continue; // Skip inactive branch
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
      return evaluateExpression(config, context, true);
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

  async _runCompensations(stack, projectId, runId) {
    logger.info(TAG, `Executing compensation stack (${stack.length} actions) for run ${runId}`);
    for (const comp of stack.reverse()) {
      try {
        if (typeof comp === 'function') await comp();
      } catch (e) {
        logger.error(TAG, `Compensation item failed: ${e.message}`);
      }
    }
  }
}

module.exports = new AutomationExecutionEngine();
