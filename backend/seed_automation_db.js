require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const AutomationTemplate = require('./src/modules/seoWorkspace/models/automationTemplate.model');
const WorkspaceAutomation = require('./src/modules/seoWorkspace/models/workspaceAutomation.model');
const AutomationWorkflow = require('./src/modules/seoWorkspace/models/automationWorkflow.model');
const AutomationWorkflowVersion = require('./src/modules/seoWorkspace/models/automationWorkflowVersion.model');
const AutomationExecutionRun = require('./src/modules/seoWorkspace/models/automationExecutionRun.model');
const AutomationExecutionNodeLog = require('./src/modules/seoWorkspace/models/automationExecutionNodeLog.model');

const MONGO_URI = process.env.MONGODB_URI;

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Seed Templates
    console.log('Seeding Templates...');
    await AutomationTemplate.deleteMany({ type: 'official' });
    const templates = await AutomationTemplate.insertMany([
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
      },
      {
        name: 'Content Auto-Publish',
        description: 'Generates blog outlines via AI and drafts them directly into your CMS.',
        category: 'Content',
        author: 'BCC Official',
        createdBy: new mongoose.Types.ObjectId(),
        type: 'official',
        nodes: [
           { id: '1', type: 'trigger', data: { triggerId: 'trigger_webhook', config: {} } },
           { id: '2', type: 'action', data: { actionId: 'ai_generate', config: { prompt: 'Write an outline.' } } }
        ],
        edges: [
           { source: '1', target: '2' }
        ]
      }
    ]);
    console.log(`Inserted ${templates.length} templates.`);

    const projectId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    // 2. Clear old data for default_project
    console.log('Clearing old mock data for default_project...');
    await WorkspaceAutomation.deleteMany({ projectId });
    await AutomationWorkflow.deleteMany({ projectId });
    await AutomationWorkflowVersion.deleteMany({ projectId });
    await AutomationExecutionRun.deleteMany({ projectId });
    await AutomationExecutionNodeLog.deleteMany({ projectId });

    // 3. Seed WorkspaceAutomation & Workflows
    console.log('Seeding Workflows...');
    
    // Create base Automation
    const automation = await WorkspaceAutomation.create({
      projectId,
      agencyId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      name: 'Default Automation Settings',
      ruleType: 'workflow',
      action: { type: 'execute_workflow' },
      enabled: true
    });

    const workflow = await AutomationWorkflow.create({
      projectId,
      agencyId: new mongoose.Types.ObjectId(),
      name: 'Content Production Pipeline',
      description: 'Generates daily content based on trending keywords.',
      status: 'Published',
      tags: ['content', 'ai'],
      createdBy: new mongoose.Types.ObjectId(),
      updatedBy: new mongoose.Types.ObjectId()
    });

    const version = await AutomationWorkflowVersion.create({
      projectId,
      workflowId: workflow._id,
      versionNumber: 1,
      isPublished: true,
      nodes: [
        { id: '1', type: 'trigger', data: { triggerId: 'trigger_schedule', config: { cronExpression: '0 0 * * *' }, label: 'Daily Cron' } },
        { id: '2', type: 'action', data: { actionId: 'ai_generate', config: { prompt: 'Find trending topics' }, label: 'AI Trend Finder' } }
      ],
      edges: [
        { source: '1', target: '2' }
      ],
      createdBy: new mongoose.Types.ObjectId()
    });

    workflow.activeVersionId = version._id;
    await workflow.save();
    
    // 4. Seed Execution History
    console.log('Seeding Execution History...');
    for (let i = 0; i < 5; i++) {
      const runStatus = i === 0 ? 'Running' : (i % 3 === 0 ? 'Failed' : 'Succeeded');
      const sTime = new Date(Date.now() - i * 3600000);
      const eTime = i === 0 ? null : new Date(Date.now() - i * 3600000 + 5000);

      const run = await AutomationExecutionRun.create({
        projectId,
        workflowId: workflow._id,
        versionId: version._id,
        status: runStatus,
        startTime: sTime,
        endTime: eTime,
        durationMs: i === 0 ? null : 5000,
        triggerContext: { keyword: 'seo' }
      });

      if (i > 0) {
        await AutomationExecutionNodeLog.create([
          {
            executionRunId: run._id,
            projectId,
            workflowId: workflow._id,
            nodeId: '1',
            nodeType: 'Trigger',
            status: 'Completed',
            startTime: sTime,
            endTime: new Date(sTime.getTime() + 1000),
            durationMs: 1000,
            outputPayload: { triggered: true }
          },
          {
            executionRunId: run._id,
            projectId,
            workflowId: workflow._id,
            nodeId: '2',
            nodeType: 'Action',
            status: runStatus === 'Succeeded' ? 'Completed' : 'Failed',
            startTime: new Date(sTime.getTime() + 1000),
            endTime: eTime,
            durationMs: 4000,
            outputPayload: runStatus === 'Succeeded' ? { content: 'Generated text' } : null,
            errorDetails: runStatus === 'Failed' ? 'AI rate limit exceeded' : null
          }
        ]);
      }
    }

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
