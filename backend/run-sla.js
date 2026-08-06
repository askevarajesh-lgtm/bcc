const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const SlaRecord = require('./src/modules/sla/sla.model');
const Task = require('./src/modules/tasks/task.model');
const Project = require('./src/modules/projects/project.model');
const Invoice = require('./src/modules/invoices/invoice.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB. Running SLA Scheduler logic once...');
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const pendingTasks = await Task.find({ 
      status: { $nin: ['completed', 'complete', 'validated', 'done', 'rejected'] } 
    });

    for (const task of pendingTasks) {
      if (!task.dueDate) continue;

      const taskCreatedAt = new Date(task.createdAt || task._id.getTimestamp());
      const isSameDayCreated = 
        taskCreatedAt.getFullYear() === now.getFullYear() &&
        taskCreatedAt.getMonth() === now.getMonth() &&
        taskCreatedAt.getDate() === now.getDate();

      if (isSameDayCreated) {
        await SlaRecord.deleteOne({ entityId: task._id, entityType: 'Task' });
        console.log(`Deleted SLA for task created today: ${task._id}`);
        continue;
      }
    }
    console.log('Done cleaning up SLAs.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
