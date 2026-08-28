const mongoose = require('mongoose');
const Task = require('./src/modules/tasks/task.model');
const Project = require('./src/modules/projects/project.model');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const project = await Project.findOne({ name: /Kumar/i });
  if (!project) {
    console.log("Project not found");
    process.exit(1);
  }
  const tasks = await Task.find({ projectId: project._id });
  console.log("Tasks found:", tasks.length);
  tasks.forEach(t => console.log(`Task: ${t.title}, status: ${t.status}, type: ${t.serviceType}`));
  
  // also check custom statuses
  const WorkflowConfig = require('./src/modules/tasks/workflowConfig.model');
  const configs = await WorkflowConfig.find();
  console.log("Workflow configs:");
  configs.forEach(c => console.log(c.projectId, c.statuses));
  
  process.exit(0);
}

run();
