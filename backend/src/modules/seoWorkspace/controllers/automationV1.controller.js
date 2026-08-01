const AutomationWorkflow = require('../models/automationWorkflow.model');
const AutomationWorkflowVersion = require('../models/automationWorkflowVersion.model');
const AutomationExecutionRun = require('../models/automationExecutionRun.model');
const AutomationExecutionNodeLog = require('../models/automationExecutionNodeLog.model');
const AutomationTemplate = require('../models/automationTemplate.model');
const validationEngine = require('../services/automationValidation.service');
const simulationEngine = require('../services/automationSimulation.service');
const executionEngine = require('../services/automationExecution.service');
const queueService = require('../../aiCore/executionQueue.service');

exports.createWorkflow = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, category, nodes, edges, variables } = req.body;

    const workflow = await AutomationWorkflow.create({
      projectId,
      agencyId: req.user._id,
      name,
      description,
      category,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const version = await AutomationWorkflowVersion.create({
      workflowId: workflow._id,
      projectId,
      versionNumber: 1,
      nodes,
      edges,
      variables,
      createdBy: req.user._id
    });

    workflow.activeVersionId = version._id;
    await workflow.save();

    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.listWorkflows = async (req, res) => {
  try {
    const { projectId } = req.params;
    const workflows = await AutomationWorkflow.find({ projectId }).populate('activeVersionId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: workflows });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getWorkflow = async (req, res) => {
  try {
    const workflow = await AutomationWorkflow.findById(req.params.id).populate('activeVersionId');
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, nodes, edges, variables } = req.body;
    const workflow = await AutomationWorkflow.findById(id);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    
    workflow.name = name || workflow.name;
    workflow.description = description || workflow.description;
    workflow.category = category || workflow.category;
    await workflow.save();

    if (nodes || edges || variables) {
      if (workflow.status === 'Published') {
        const lastVersion = await AutomationWorkflowVersion.findOne({ workflowId: id }).sort({ versionNumber: -1 });
        const version = await AutomationWorkflowVersion.create({
          workflowId: workflow._id,
          projectId: workflow.projectId,
          versionNumber: (lastVersion?.versionNumber || 0) + 1,
          nodes: nodes || lastVersion.nodes,
          edges: edges || lastVersion.edges,
          variables: variables || lastVersion.variables,
          createdBy: req.user._id
        });
        workflow.activeVersionId = version._id;
        await workflow.save();
      } else {
        await AutomationWorkflowVersion.findByIdAndUpdate(workflow.activeVersionId, { nodes, edges, variables });
      }
    }
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    await AutomationWorkflow.findByIdAndDelete(id);
    await AutomationWorkflowVersion.deleteMany({ workflowId: id });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.cloneWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await AutomationWorkflow.findById(id).lean();
    if (!workflow) return res.status(404).json({ success: false, error: 'Not found' });
    
    const activeVersion = await AutomationWorkflowVersion.findById(workflow.activeVersionId).lean();
    
    const newWorkflow = await AutomationWorkflow.create({
      ...workflow,
      _id: undefined,
      name: `${workflow.name} (Clone)`,
      status: 'Draft',
      activeVersionId: undefined,
      createdAt: undefined,
      updatedAt: undefined
    });

    const newVersion = await AutomationWorkflowVersion.create({
      ...activeVersion,
      _id: undefined,
      workflowId: newWorkflow._id,
      versionNumber: 1,
      createdAt: undefined,
      updatedAt: undefined
    });

    newWorkflow.activeVersionId = newVersion._id;
    await newWorkflow.save();

    res.status(201).json({ success: true, data: newWorkflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.exportWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await AutomationWorkflow.findById(id).lean();
    const version = await AutomationWorkflowVersion.findById(workflow.activeVersionId).lean();
    res.status(200).json({ success: true, data: { workflow, version } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.importWorkflow = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { workflow, version } = req.body;
    
    const newWorkflow = await AutomationWorkflow.create({
      ...workflow,
      _id: undefined,
      projectId,
      agencyId: req.user._id,
      status: 'Draft',
      activeVersionId: undefined
    });

    const newVersion = await AutomationWorkflowVersion.create({
      ...version,
      _id: undefined,
      workflowId: newWorkflow._id,
      projectId,
      versionNumber: 1
    });

    newWorkflow.activeVersionId = newVersion._id;
    await newWorkflow.save();

    res.status(201).json({ success: true, data: newWorkflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rollbackWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;
    const workflow = await AutomationWorkflow.findById(id);
    workflow.activeVersionId = versionId;
    await workflow.save();
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.publishWorkflow = async (req, res) => {
  try {
    const workflow = await AutomationWorkflow.findById(req.params.id);
    workflow.status = 'Published';
    await workflow.save();
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.archiveWorkflow = async (req, res) => {
  try {
    const workflow = await AutomationWorkflow.findById(req.params.id);
    workflow.status = 'Archived';
    await workflow.save();
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.runWorkflow = async (req, res) => {
  try {
    const { projectId, id } = req.params;
    const workflow = await AutomationWorkflow.findById(id);
    if (!workflow || !workflow.activeVersionId) throw new Error('Workflow or active version not found');

    queueService.enqueueWorkflowExecution({
      projectId,
      workflowId: id,
      versionId: workflow.activeVersionId,
      triggerContext: { source: 'manual', userId: req.user._id }
    });

    res.status(200).json({ success: true, message: 'Execution queued' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.simulateWorkflow = async (req, res) => {
  try {
    const { nodes, edges, variables } = req.body;
    const trace = await simulationEngine.simulateWorkflowRun({ nodes, edges, variables }, { source: 'simulation' });
    res.status(200).json({ success: true, data: trace });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.cancelExecution = async (req, res) => {
  const { runId } = req.body;
  const cancelled = queueService.cancelTask(runId);
  res.status(200).json({ success: true, cancelled });
};

exports.getHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const runs = await AutomationExecutionRun.find({ projectId }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, data: runs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { runId } = req.params;
    const logs = await AutomationExecutionNodeLog.find({ executionRunId: runId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const metrics = queueService.getMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getQueueStatus = async (req, res) => {
  res.status(200).json({ success: true, data: queueService.getMetrics() });
};

exports.validateWorkflow = async (req, res) => {
  try {
    const validation = validationEngine.validate(req.body);
    res.status(200).json({ success: true, data: validation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.listTemplates = async (req, res) => {
  try {
    let templates = await AutomationTemplate.find({ type: { $in: ['official', 'community', 'workspace'] } });
    
    if (templates.length === 0) {
      const mongoose = require('mongoose');
      await AutomationTemplate.insertMany([
        {
          name: 'Weekly SEO Audit',
          description: 'Runs a comprehensive technical SEO audit every Monday and sends a Slack report.',
          category: 'Technical SEO',
          author: 'BCC Official',
          createdBy: new mongoose.Types.ObjectId(),
          type: 'official',
          nodes: [
            { id: '1', type: 'trigger', data: { triggerId: 'trigger_schedule', config: { cronExpression: '0 0 * * 1' } } },
            { id: '2', type: 'action', data: { actionId: 'ai_generate', config: { prompt: 'Summarize the audit' } } }
          ],
          edges: [
            { source: '1', target: '2' }
          ]
        },
        {
          name: 'Rank Drop Alert',
          description: 'Monitors keyword rankings and triggers an alert if top 3 positions are lost.',
          category: 'Rank Tracking',
          author: 'BCC Official',
          createdBy: new mongoose.Types.ObjectId(),
          type: 'official',
          nodes: [
             { id: '1', type: 'trigger', data: { triggerId: 'trigger_schedule', config: { cronExpression: '0 8 * * *' } } },
             { id: '2', type: 'action', data: { actionId: 'send_slack', config: { message: 'Rankings dropped!' } } }
          ],
          edges: [
             { source: '1', target: '2' }
          ]
        }
      ]);
      templates = await AutomationTemplate.find({ type: { $in: ['official', 'community', 'workspace'] } });
    }

    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
