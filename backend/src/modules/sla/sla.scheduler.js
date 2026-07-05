const cron = require('node-cron');
const SlaRecord = require('./sla.model');
const Task = require('../tasks/task.model');
const Invoice = require('../invoices/invoice.model');
const Project = require('../projects/project.model');

// Run every hour
const startSlaScheduler = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running SLA Scheduler...');
    try {
      const now = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      // 1. Check Due Dates for Tasks
      const pendingTasks = await Task.find({ 
        status: { $nin: ['completed', 'complete', 'validated', 'done', 'rejected'] } 
      });

      for (const task of pendingTasks) {
        if (!task.dueDate) continue;

        let status = 'Normal';
        const dueDate = new Date(task.dueDate);

        if (now > dueDate) {
          status = 'Breached';
        } else if (dueDate <= twoDaysFromNow) {
          status = 'At Risk';
        }

        // Upsert SLA Record
        await SlaRecord.findOneAndUpdate(
          { entityId: task._id, entityType: 'Task' },
          {
            slaId: `SLA-TSK-${task._id.toString().substring(0, 8).toUpperCase()}`,
            clientId: task.companyId,
            agencyId: task.tenantCompanyId,
            clientType: task.taskType === 'own_brand' ? 'Agency' : 'Direct User Client',
            triggerType: 'Due Date',
            entityId: task._id,
            entityType: 'Task',
            title: `Task: ${task.title}`,
            description: `Due Date Monitoring for Task ${task.title}`,
            dueDate: task.dueDate,
            priority: task.priority === 'high' || task.priority === 'critical' ? task.priority : (status === 'Breached' ? 'High' : 'Medium'),
            status,
            assignedTo: task.assignedTo
          },
          { upsert: true, new: true }
        );
      }

      // 2. Check Due Dates for Projects
      const pendingProjects = await Project.find({
        status: { $nin: ['completed', 'cancelled'] }
      });

      for (const project of pendingProjects) {
        if (!project.endDate) continue;

        let status = 'Normal';
        const dueDate = new Date(project.endDate);

        if (now > dueDate) {
          status = 'Breached';
        } else if (dueDate <= twoDaysFromNow) {
          status = 'At Risk';
        }

        let remainingServices = [];
        if (project.remainingPosters > 0) remainingServices.push(`${project.remainingPosters} Posters`);
        if (project.remainingVideos > 0) remainingServices.push(`${project.remainingVideos} Videos`);
        if (project.remainingShoots > 0) remainingServices.push(`${project.remainingShoots} Shoots`);
        
        if (project.selectedCategories && Array.isArray(project.selectedCategories)) {
          project.selectedCategories.forEach(cat => {
            const rawName = cat.name || cat.categoryName || "";
            const isStandard = ["poster", "video", "shoot"].some(k => rawName.toLowerCase().includes(k));
            if (!isStandard) {
              const pendingCount = cat.remaining !== undefined ? cat.remaining : cat.quantity;
              if (pendingCount > 0) {
                remainingServices.push(`${pendingCount} ${rawName}`);
              }
            }
          });
        }
        
        let description = `Due Date Monitoring for Project ${project.name}`;
        if (status === 'At Risk' || status === 'Breached') {
          description = `Project Near Due Date. Pending: ${remainingServices.length > 0 ? remainingServices.join(', ') : 'None'}`;
          
          if (project.status !== 'project_near_due_date') {
            project.status = 'project_near_due_date';
            await project.save();
          }
        }

        await SlaRecord.findOneAndUpdate(
          { entityId: project._id, entityType: 'Project' },
          {
            slaId: `SLA-PRJ-${project._id.toString().substring(0, 8).toUpperCase()}`,
            clientId: project.companyId,
            agencyId: project.tenantCompanyId,
            clientType: 'Direct User Client',
            triggerType: 'Due Date',
            entityId: project._id,
            entityType: 'Project',
            title: `Project: ${project.name}`,
            description,
            dueDate: project.endDate,
            priority: status === 'Breached' ? 'High' : 'Medium',
            status
          },
          { upsert: true, new: true }
        );
      }

      // 3. Check Payments for Invoices
      const unpaidInvoices = await Invoice.find({
        status: { $nin: ['paid', 'cancelled'] }
      });

      for (const invoice of unpaidInvoices) {
        if (!invoice.dueDate) continue;

        let status = 'Normal';
        const dueDate = new Date(invoice.dueDate);

        if (now > dueDate) {
          status = 'Breached';
        } else if (dueDate <= twoDaysFromNow) {
          status = 'At Risk';
        }
        
        if (invoice.status === 'failed') {
          status = 'Breached';
        }

        await SlaRecord.findOneAndUpdate(
          { entityId: invoice._id, entityType: 'Invoice' },
          {
            slaId: `SLA-INV-${invoice._id.toString().substring(0, 8).toUpperCase()}`,
            clientId: invoice.companyId,
            agencyId: invoice.tenantCompanyId,
            clientType: 'Direct User Client',
            triggerType: 'Payment',
            entityId: invoice._id,
            entityType: 'Invoice',
            title: `Invoice: ${invoice.invoiceNumber || invoice._id}`,
            description: `Payment Monitoring for Invoice`,
            dueDate: invoice.dueDate,
            paymentStatus: invoice.status,
            priority: status === 'Breached' ? 'Critical' : 'Medium',
            status
          },
          { upsert: true, new: true }
        );
      }

      console.log('SLA Scheduler completed successfully.');
    } catch (error) {
      console.error('Error running SLA Scheduler:', error);
    }
  });
};

module.exports = startSlaScheduler;
