require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/modules/tasks/task.model');
const User = require('./src/modules/auth/user.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const users = await User.find({ name: { $regex: /Dravit/i } });
  console.log('Users found:', users.map(u => ({ id: u._id, name: u.name, role: u.role, agencyId: u.agencyId, brandId: u.brandId })));
  
  if (users.length > 0) {
    const userId = users[0]._id;
    const tasks = await Task.find({ assignedTo: userId });
    console.log(`Tasks for ${users[0].name}:`, tasks.length);
    if (tasks.length > 0) {
      console.log(tasks.map(t => ({ id: t._id, title: t.title, tenantCompanyId: t.tenantCompanyId, companyId: t.companyId, startDate: t.startDate, dueDate: t.dueDate })));
    }
  }

  const tasksWithDeploy = await Task.find({ title: { $regex: /Website/i } });
  console.log('Tasks with Website:', tasksWithDeploy.map(t => ({ title: t.title, assignedTo: t.assignedTo, tenantCompanyId: t.tenantCompanyId, companyId: t.companyId })));
  
  process.exit(0);
}

run();
