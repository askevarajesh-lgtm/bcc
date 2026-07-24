require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/modules/tasks/task.model');

async function fixTasks() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const tasks = await Task.find({
    companyId: { $ne: null },
    $expr: { $ne: ["$tenantCompanyId", "$companyId"] }
  });
  
  console.log(`Found ${tasks.length} tasks to fix...`);
  
  for (const task of tasks) {
    task.tenantCompanyId = task.companyId;
    await task.save();
    console.log(`Updated task ${task._id}`);
  }
  
  console.log('Done.');
  process.exit(0);
}

fixTasks();
