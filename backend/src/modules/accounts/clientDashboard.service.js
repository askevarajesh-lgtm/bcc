const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const Invoice = require('../invoices/invoice.model');

exports.getClientExecutiveDashboard = async (clientId, companyId, queryMonth, queryYear) => {
  const now = (queryMonth && queryYear) ? new Date(parseInt(queryYear), parseInt(queryMonth), 15) : new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Projects
  const allProjects = await Project.find({ clientId: clientId });
  const activeProjectsCount = allProjects.filter(p => p.status !== 'completed').length;
  const completedProjectsCount = allProjects.filter(p => p.status === 'completed').length;
  
  // Invoices (Spend/ROI tracking)
  const invoices = await Invoice.find({ clientId: clientId, isDeleted: false });
  const sentInvoices = invoices.filter(i => i.invoiceStatus !== 'Draft').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingInvoices = sentInvoices.filter(i => i.paymentStatus !== 'Paid');
  const latestPendingInvoice = pendingInvoices[0] || null;

  let outstandingAmount = 0;
  let paidAmountThisMonth = 0;
  let totalSpend = 0;

  sentInvoices.forEach(inv => {
    const pending = inv.pendingAmount || inv.grandTotal || 0;
    const paid = inv.totalPaid || 0;
    totalSpend += paid;

    if (inv.paymentStatus !== 'Paid') {
      outstandingAmount += pending;
    }
    
    if (inv.createdAt) {
      const d = new Date(inv.createdAt);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
         paidAmountThisMonth += paid;
      }
    }
  });

  // Approvals (Tasks waiting for review)
  const pendingApprovalTasks = await Task.find({ 
    $or: [{ companyId: clientId }, { tenantCompanyId: clientId }, { companyId }], 
    status: { $in: ['sent_for_client_review', 'review', 'in_review'] } 
  }).limit(5);

  return {
    stats: {
      activeProjects: activeProjectsCount,
      completedProjects: completedProjectsCount,
      totalInvoicesCount: sentInvoices.length,
      pendingInvoicesCount: pendingInvoices.length,
      outstandingAmount,
      paidAmountThisMonth,
      totalSpend
    },
    upcomingInvoice: latestPendingInvoice,
    pendingApprovals: pendingApprovalTasks,
    recentInvoices: sentInvoices.slice(0, 5)
  };
};

exports.getClientOperationsDashboard = async (clientId, companyId, queryMonth, queryYear) => {
  const now = (queryMonth && queryYear) ? new Date(parseInt(queryYear), parseInt(queryMonth), 15) : new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Tasks
  const allTasks = await Task.find({ 
    $or: [{ companyId: clientId }, { tenantCompanyId: clientId }, { companyId }]
  });

  const totalTasksThisMonth = allTasks.filter(t => t.createdAt >= startOfMonth && t.createdAt <= endOfMonth).length;
  const completedTasksThisMonth = allTasks.filter(t => ['done', 'complete', 'completed'].includes(t.status?.toLowerCase()) && t.updatedAt >= startOfMonth && t.updatedAt <= endOfMonth).length;
  
  const openTasks = allTasks.filter(t => !['done', 'complete', 'completed'].includes(t.status?.toLowerCase()));
  const overdueTasks = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  // Deliverables logic
  const deliverableStatuses = ['completed', 'complete', 'approved', 'validated', 'done'];
  const actualDeliverables = allTasks
    .filter(t => deliverableStatuses.includes(t.status?.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  
  const recentDeliverables = actualDeliverables.slice(0, 5);
  
  const pendingDeliverableStatuses = ['todo', 'in_progress', 'in_review', 'review', 'sent_for_client_review'];
  const pendingDeliverables = allTasks.filter(t => pendingDeliverableStatuses.includes(t.status?.toLowerCase())).length;

  return {
    stats: {
      totalTasksThisMonth,
      completedTasksThisMonth,
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
      pendingDeliverables
    },
    recentDeliverables,
    actionItems: overdueTasks.slice(0, 5)
  };
};
