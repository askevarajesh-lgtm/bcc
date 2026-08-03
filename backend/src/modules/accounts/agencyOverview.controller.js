const User = require('../auth/user.model');
const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const SlaRecord = require('../sla/sla.model');
const Invoice = require('../invoices/invoice.model');
const { MosScoreHistory } = require('../mos/mos.model');

// Optional chaining helper to safely parse numbers
const parseNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

exports.getOverviewData = async (req, res, next) => {
  try {
    const agencyId = req.user.role === 'agency_super_admin' ? req.user._id : req.user.agencyId;
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency context not found' });
    }

    const queryMonth = req.query.month;
    const queryYear = req.query.year;
    const queryClientId = req.query.clientId;

    const now = (queryMonth && queryYear) ? new Date(parseInt(queryYear), parseInt(queryMonth), 15) : new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Clients
    let clientQuery = { agencyId, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
    if (queryClientId) {
      clientQuery._id = queryClientId;
    }
    const clientsData = await User.find(clientQuery).select('_id companyName name');
    const clientIds = clientsData.map(c => c._id);

    // 2. Team Members
    const teamData = await User.find({ agencyId, role: { $in: ['agency_manager', 'user'] } }).select('_id name');

    // 3. Projects & Tasks
    let projectQuery = { agencyId };
    if (queryClientId) projectQuery.clientId = queryClientId;
    const allProjects = await Project.find(projectQuery);
    const activeProjectsCount = allProjects.filter(p => p.status !== 'completed').length;
    const completedProjectsCount = allProjects.filter(p => p.status === 'completed').length;

    let taskQuery = { agencyId };
    if (queryClientId) taskQuery.companyId = queryClientId;
    const allTasks = await Task.find(taskQuery);
    const totalTasksThisMonth = allTasks.filter(t => t.createdAt >= startOfMonth && t.createdAt <= endOfMonth).length;
    const completedTasksThisMonth = allTasks.filter(t => t.status === 'done' && t.updatedAt >= startOfMonth && t.updatedAt <= endOfMonth).length;

    // 4. SLA Compliance
    let slaQuery = { agencyId };
    if (queryClientId) slaQuery.clientId = queryClientId;
    const slas = await SlaRecord.find(slaQuery);
    const totalSlas = slas.length;
    const breachedSlas = slas.filter(s => s.status === 'Breached').length;
    const slaCompliance = totalSlas > 0 ? Math.round(((totalSlas - breachedSlas) / totalSlas) * 100) : 100;

    // 5. Financials (Invoices Month-wise)
    let invoiceQuery = { agencyId, isDeleted: false };
    if (queryClientId) invoiceQuery.clientId = queryClientId;
    const invoices = await Invoice.find(invoiceQuery);
    
    let currentMonthRevenue = 0;
    let outstandingInvoicesAmount = 0;
    let outstandingInvoicesCount = 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartDataMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      chartDataMap[key] = {
        name: monthNames[d.getMonth()],
        revenue: 0,
        sortOrder: d.getTime()
      };
    }

    invoices.forEach(inv => {
      const amount = inv.grandTotal || 0;
      const paid = inv.totalPaid || 0;
      const pending = inv.pendingAmount || amount;

      if (inv.createdAt) {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (chartDataMap[key]) {
          chartDataMap[key].revenue += paid;
        }
        
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
           currentMonthRevenue += paid;
        }
      }
      
      if (inv.paymentStatus !== 'Paid') {
          outstandingInvoicesAmount += pending;
          outstandingInvoicesCount++;
      }
    });

    const revenueChartData = Object.values(chartDataMap).sort((a, b) => a.sortOrder - b.sortOrder);

    // 6. Client MOS Details
    const mosHistories = await MosScoreHistory.find({ agencyId, clientId: { $in: clientIds } }).sort({ createdAt: -1 });
    const latestMosByClient = {};
    mosHistories.forEach(hist => {
      const cid = hist.clientId.toString();
      if (!latestMosByClient[cid]) {
        latestMosByClient[cid] = hist;
      }
    });

    // Also get MRR/active projects per client
    const clients = clientsData.map(c => {
      const cidStr = c._id.toString();
      const hist = latestMosByClient[cidStr];
      const mos = hist && hist.overallMos ? hist.overallMos : 0;
      const signals = hist && hist.signals ? hist.signals : { seo: 0, ads: 0, leads: 0, social: 0, website: 0, geo: 0, cx: 0, rev: 0 };
      
      const clientInvoices = invoices.filter(inv => inv.clientId && inv.clientId.toString() === cidStr);
      let mrr = 0;
      clientInvoices.forEach(inv => {
         if(inv.invoiceType === 'Retainer' && inv.invoiceStatus !== 'Cancelled') {
             mrr += inv.grandTotal || 0;
         }
      });
      
      const clientProjects = allProjects.filter(p => p.clientId && p.clientId.toString() === cidStr && p.status !== 'completed');

      return {
        id: c._id,
        name: c.companyName || c.name || 'Unnamed Client',
        code: (c.companyName || c.name || 'Un').substring(0, 2).toUpperCase(),
        mos: Math.round(mos),
        signals,
        mrr,
        activeProjects: clientProjects.length,
        weakestSignals: hist && hist.weakestSignals ? hist.weakestSignals : []
      };
    }).sort((a, b) => b.mos - a.mos);

    // 7. Team Performance Details
    let teamTaskMatch = { assignee: { $in: teamData.map(t => t._id) } };
    if (queryClientId) {
      // Find tasks specifically for this client that these team members worked on
      const clientTaskIds = allTasks.map(t => t._id);
      teamTaskMatch._id = { $in: clientTaskIds };
    }
    const teamTasks = await Task.aggregate([
      { $match: teamTaskMatch },
      { $group: { _id: '$assignee', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } }
    ]);

    const team = teamData.map(t => {
      const taskObj = teamTasks.find(tk => tk._id.toString() === t._id.toString());
      const tasksAssigned = taskObj ? taskObj.total : 0;
      const tasksCompleted = taskObj ? taskObj.completed : 0;
      const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
      const initials = (t.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return {
        id: t._id,
        name: t.name,
        initials,
        tasksAssigned,
        tasksCompleted,
        completionRate,
        status: completionRate >= 80 ? 'good' : (completionRate >= 50 ? 'warning' : 'danger')
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          activeClients: clientsData.length,
          activeProjects: activeProjectsCount,
          completedProjects: completedProjectsCount,
          slaCompliance,
          breachedSlas,
          outstandingInvoicesAmount,
          outstandingInvoicesCount,
          currentMonthRevenue,
          totalTasksThisMonth,
          completedTasksThisMonth
        },
        filters: {
          month: now.getMonth(),
          year: now.getFullYear(),
          clientId: queryClientId || null
        },
        revenueChartData,
        clients,
        team
      }
    });
  } catch (error) {
    console.error('Error fetching agency overview:', error);
    next(error);
  }
};
