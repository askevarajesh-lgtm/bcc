const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const Invoice = require('../invoices/invoice.model');

exports.getClientOverviewData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // For clients, they might be associated with an agency (agencyId) and they might have their own company (which is themselves as a client).
    // The client's ID in terms of "companyId" or "clientId" is their own user ID or their company ID.
    // In many modules, the client's ID is used to filter tasks/invoices. 
    // Usually, `req.user.role` includes 'brand_super_admin', 'brand_manager', 'agency_client', etc.
    const clientId = req.user._id; 
    
    // Fallback: some schemas use companyId = req.user.companyId if it exists, but typically the user object represents the client entity.
    const companyId = req.user.companyId || req.user._id;

    const queryMonth = req.query.month;
    const queryYear = req.query.year;

    const now = (queryMonth && queryYear) ? new Date(parseInt(queryYear), parseInt(queryMonth), 15) : new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Tasks & Deliverables
    const allTasks = await Task.find({ 
      $or: [
        { companyId: companyId },
        { clientId: clientId }
      ]
    });

    const totalTasksThisMonth = allTasks.filter(t => t.createdAt >= startOfMonth && t.createdAt <= endOfMonth).length;
    const completedTasksThisMonth = allTasks.filter(t => t.status === 'done' && t.updatedAt >= startOfMonth && t.updatedAt <= endOfMonth).length;

    // Deliverables logic (tasks with specific statuses)
    const deliverableStatuses = ['completed', 'complete', 'approved', 'validated', 'done', 'review', 'in_review', 'sent_for_client_review', 'workflow_sent'];
    const actualDeliverables = allTasks
      .filter(t => deliverableStatuses.includes(t.status?.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    
    const recentDeliverables = actualDeliverables.slice(0, 5);
    
    const pendingDeliverableStatuses = ['todo', 'in_progress', 'in_review', 'review', 'sent_for_client_review'];
    const pendingDeliverables = allTasks.filter(t => pendingDeliverableStatuses.includes(t.status?.toLowerCase())).length;

    // 2. Projects
    const allProjects = await Project.find({ clientId: clientId });
    const activeProjectsCount = allProjects.filter(p => p.status !== 'completed').length;
    const completedProjectsCount = allProjects.filter(p => p.status === 'completed').length;
    const completedProjectsThisMonth = allProjects.filter(p => p.status === 'completed' && p.completedAt >= startOfMonth && p.completedAt <= endOfMonth).length;

    // 3. Invoices
    const invoices = await Invoice.find({ clientId: clientId, isDeleted: false });
    const sentInvoices = invoices
      .filter(i => i.invoiceStatus !== 'Draft')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const pendingInvoices = sentInvoices.filter(i => i.paymentStatus !== 'Paid');
    const latestPendingInvoice = pendingInvoices[0] || null;

    let outstandingAmount = 0;
    let paidAmountThisMonth = 0;

    sentInvoices.forEach(inv => {
      const pending = inv.pendingAmount || inv.grandTotal || 0;
      const paid = inv.totalPaid || 0;

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

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTasksThisMonth,
          completedTasksThisMonth,
          pendingDeliverables,
          activeProjects: activeProjectsCount,
          completedProjects: completedProjectsCount,
          completedProjectsThisMonth,
          totalInvoicesCount: sentInvoices.length,
          pendingInvoicesCount: pendingInvoices.length,
          outstandingAmount,
          paidAmountThisMonth
        },
        filters: {
          month: now.getMonth(),
          year: now.getFullYear()
        },
        recentDeliverables,
        upcomingInvoice: latestPendingInvoice,
        recentInvoices: sentInvoices.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching client overview:', error);
    next(error);
  }
};
