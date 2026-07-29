const SalesTarget = require("./sales.model");
const Invoice = require("../invoices/invoice.model");
const Project = require("../projects/project.model");
const Task = require("../tasks/task.model");
const User = require("../auth/user.model");
const Proposal = require("../proposals/proposal.model");

const getTargets = async (companyId, filters = {}) => {
  const query = { companyId };

  if (filters.userId) query.userId = filters.userId;
  if (filters.team) query.team = filters.team;
  if (filters.month) query.month = filters.month;
  if (filters.year) query.year = filters.year;

  return await SalesTarget.find(query)
    .populate("userId", "name email role team")
    .sort({ year: -1, month: -1 });
};

const createTarget = async (targetData, companyId) => {
  const { userId, team, month, year, targetAmount } = targetData;

  // Validate: Either userId or team must be provided
  if (!userId && !team) {
    throw new Error("Either userId or team must be provided");
  }

  // Check if target already exists
  const existingQuery = userId
    ? { userId, month, year, companyId }
    : { team, month, year, companyId };

  const existing = await SalesTarget.findOne(existingQuery);
  if (existing) {
    throw new Error(
      `Target already exists for this ${userId ? "user" : "team"} and period`,
    );
  }

  const target = await SalesTarget.create({
    userId: userId || null,
    team: team || null,
    month,
    year,
    targetAmount,
    remainingAmount: targetAmount,
    achievedAmount: 0,
    totalIncome: 0,
    pendingAmount: 0,
    profitAmount: 0,
    profitPercentage: 0,
    companyId,
  });

  // Recalculate metrics for the target
  await recalculateTargetMetrics(target._id, companyId);

  return await SalesTarget.findById(target._id).populate(
    "userId",
    "name email role team",
  );
};

const updateTarget = async (targetId, targetData, companyId) => {
  const target = await SalesTarget.findOne({ _id: targetId, companyId });

  if (!target) {
    throw new Error("Target not found");
  }

  if (targetData.targetAmount !== undefined) {
    const difference = targetData.targetAmount - target.targetAmount;
    target.targetAmount = targetData.targetAmount;
    target.remainingAmount += difference;
  }

  await target.save();

  return await SalesTarget.findById(target._id).populate(
    "userId",
    "name email",
  );
};

// This is called automatically when invoice is paid
const updateTargetOnPayment = async (
  userId,
  amount,
  month,
  year,
  companyId,
) => {
  // Update individual target
  const target = await SalesTarget.findOne({ userId, month, year, companyId });
  if (target) {
    await recalculateTargetMetrics(target._id, companyId);
  }

  // Also update team target if user belongs to a team
  const user = await User.findById(userId);
  if (user && user.team) {
    const teamTarget = await SalesTarget.findOne({
      team: user.team,
      month,
      year,
      companyId,
    });
    if (teamTarget) {
      await recalculateTargetMetrics(teamTarget._id, companyId);
    }
  }
};

/**
 * Recalculate all metrics for a target (income, pending, profit, etc.)
 */
const recalculateTargetMetrics = async (targetId, companyId) => {
  const target = await SalesTarget.findOne({ _id: targetId, companyId });
  if (!target) return;

  const startDate = new Date(target.year, target.month - 1, 1);
  const endDate = new Date(target.year, target.month, 0, 23, 59, 59);

  // Get invoices for this period
  let invoiceQuery = {
    companyId,
    invoiceDate: { $gte: startDate, $lte: endDate },
  };

  // Filter by userId or team
  if (target.userId) {
    invoiceQuery.salespersonId = target.userId;
  } else if (target.team) {
    // Get all users in this team
    const teamUsers = await User.find({
      team: target.team,
      companyId,
      isActive: true,
    }).select("_id");
    const teamUserIds = teamUsers.map((u) => u._id);
    invoiceQuery.salespersonId = { $in: teamUserIds };
  }

  const invoices = await Invoice.find(invoiceQuery);

  // Get accessible client IDs for this user/team
  let clientIds = [];
  if (target.userId) {
    const user = await User.findById(target.userId).select("assignedClients");
    clientIds = user?.assignedClients || [];
  } else if (target.team) {
    const teamUsers = await User.find({
      team: target.team,
      companyId,
      isActive: true,
    }).select("assignedClients");
    clientIds = [...new Set(teamUsers.flatMap((u) => u.assignedClients || []))];
  }

  // If no assigned clients, get clients from invoices
  if (clientIds.length === 0) {
    clientIds = [
      ...new Set(
        invoices
          .map((inv) => inv.clientId?.toString() || inv.clientId)
          .filter(Boolean),
      ),
    ];
  }

  // Calculate total income (only from handling category, only paid invoices + approved proposals)
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  let totalIncome = 0;
  paidInvoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      if (item.category === "handling") {
        totalIncome += item.taxableValue || 0; // Only handling amount, excl GST
      }
    });
  });

  // Add approved proposal handling amounts to income
  let approvedProposalIncomeQuery = {
    companyId,
    status: "approved",
    approvedAt: { $gte: startDate, $lte: endDate },
  };
  if (clientIds.length > 0) {
    approvedProposalIncomeQuery.clientCompanyId = { $in: clientIds };
  }
  if (target.userId) {
    approvedProposalIncomeQuery.createdBy = target.userId;
  } else if (target.team) {
    const teamUsers = await User.find({
      team: target.team,
      companyId,
      isActive: true,
    }).select("_id");
    const teamUserIds = teamUsers.map((u) => u._id);
    approvedProposalIncomeQuery.createdBy = { $in: teamUserIds };
  }
  const approvedProposalsForIncome = await Proposal.find(
    approvedProposalIncomeQuery,
  );
  approvedProposalsForIncome.forEach((proposal) => {
    totalIncome += proposal.commercials?.totalHandlingAmount || 0;
  });

  // Add campaign revenue (amountPaidByClient from paid campaigns)
  // Not used in new CRM
  /*
  if (clientIds.length > 0) {
    const paidCampaigns = await Campaign.find({
      companyId,
      clientCompanyId: { $in: clientIds },
      paymentStatus: "paid",
      paidDate: { $gte: startDate, $lte: endDate },
    });

    paidCampaigns.forEach((campaign) => {
      totalIncome += campaign.amountPaidByClient || 0; // Amount paid by client, excl GST
    });
  }
  */

  // Calculate pending amount (unpaid invoices + sent proposals) - SALES DATA ONLY
  const unpaidInvoices = invoices.filter((inv) =>
    ["draft", "sent"].includes(inv.status),
  );
  let pendingAmount = 0;
  unpaidInvoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      if (item.category === "handling") {
        pendingAmount += item.totalAmount || 0; // Total including tax
      }
    });
  });

  // Add pending proposal handling amounts (sent proposals only - sales data)
  let proposalQuery = {
    companyId,
    status: "sent",
    date: { $gte: startDate, $lte: endDate },
  };

  // Filter by client IDs if available
  if (clientIds.length > 0) {
    proposalQuery.clientCompanyId = { $in: clientIds };
  }

  // If individual target, filter by createdBy
  if (target.userId) {
    proposalQuery.createdBy = target.userId;
  } else if (target.team) {
    const teamUsers = await User.find({
      team: target.team,
      companyId,
      isActive: true,
    }).select("_id");
    const teamUserIds = teamUsers.map((u) => u._id);
    proposalQuery.createdBy = { $in: teamUserIds };
  }

  const sentProposals = await Proposal.find(proposalQuery);
  sentProposals.forEach((proposal) => {
    pendingAmount += proposal.commercials?.totalHandlingAmount || 0;
  });

  // Add pending campaign amounts
  // Not used in new CRM
  /*
  if (clientIds.length > 0) {
    const pendingCampaigns = await Campaign.find({
      companyId,
      clientCompanyId: { $in: clientIds },
      paymentStatus: { $in: ["pending", "partial"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    pendingCampaigns.forEach((campaign) => {
      const pending =
        (campaign.totalCampaignValue || campaign.campaignAmount || 0) -
        (campaign.amountPaidByClient || 0);
      pendingAmount += pending > 0 ? pending : 0;
    });
  }
  */

  // Calculate achieved amount (total invoice amount for paid invoices + approved proposals + campaign payments)
  const invoiceAchieved = paidInvoices.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0,
  );

  // Add approved proposal handling amounts
  let approvedProposalQuery = {
    companyId,
    status: "approved",
    approvedAt: { $gte: startDate, $lte: endDate },
  };
  if (clientIds.length > 0) {
    approvedProposalQuery.clientCompanyId = { $in: clientIds };
  }
  if (target.userId) {
    approvedProposalQuery.createdBy = target.userId;
  } else if (target.team) {
    const teamUsers = await User.find({
      team: target.team,
      companyId,
      isActive: true,
    }).select("_id");
    const teamUserIds = teamUsers.map((u) => u._id);
    approvedProposalQuery.createdBy = { $in: teamUserIds };
  }
  const approvedProposals = await Proposal.find(approvedProposalQuery);
  const proposalAchieved = approvedProposals.reduce(
    (sum, prop) => sum + (prop.commercials?.totalHandlingAmount || 0),
    0,
  );

  const campaignAchieved = 0; // Campaign achievement logic removed for new CRM
  const achievedAmount = invoiceAchieved + proposalAchieved + campaignAchieved;

  // Calculate expenses for this period (if individual target, filter by user's expenses)
  // Expenses tracking removed in new CRM
  let totalExpenses = 0;

  // Add campaign actual spend (cost)
  // Not used in new CRM

  // Add task execution costs (by department/member if applicable)
  if (target.userId || target.team) {
    let taskQuery = {
      tenantCompanyId: companyId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (target.userId) {
      taskQuery.assignedTo = target.userId;
    } else if (target.team) {
      const teamUsers = await User.find({
        team: target.team,
        companyId,
        isActive: true,
      }).select("_id");
      const teamUserIds = teamUsers.map((u) => u._id);
      taskQuery.assignedTo = { $in: teamUserIds };
    }

    // Get projects for these clients to filter tasks
    if (clientIds.length > 0) {
      const projects = await Project.find({
        companyId,
        clientId: { $in: clientIds },
      }).select("_id");
      const projectIds = projects.map((p) => p._id);
      taskQuery.projectId = { $in: projectIds };
    }

    const tasks = await Task.find(taskQuery).populate("assignedTo", "role");

    // Calculate task costs based on time spent and role hourly cost
    const ROLE_HOURLY_COST = {
      digital_marketing_manager: 1500,
      digital_marketing_executive: 1000,
      designer: 1200,
      editor: 1000,
      developer: 2000,
      operations_head: 1800,
      video_editor: 1000,
    };

    tasks.forEach((task) => {
      if (task.timeSpent && task.assignedTo) {
        const roleCost = ROLE_HOURLY_COST[task.assignedTo.role] || 0;
        totalExpenses += (task.timeSpent || 0) * roleCost;
      }
    });
  }

  // Calculate profit
  const profitAmount = totalIncome - totalExpenses;
  const profitPercentage =
    totalIncome > 0 ? (profitAmount / totalIncome) * 100 : 0;

  // Update target
  target.totalIncome = totalIncome;
  target.pendingAmount = pendingAmount;
  target.achievedAmount = achievedAmount;
  target.remainingAmount = Math.max(0, target.targetAmount - achievedAmount);
  target.profitAmount = profitAmount;
  target.profitPercentage = Math.max(0, Math.min(100, profitPercentage));

  await target.save();
};

/**
 * Get sales tracking insights (real-time) - Based on Invoices
 * Shows invoice totals, collected (paid), and pending amounts
 */
const getSalesTracking = async (companyId, filters = {}) => {
  const Invoice = require("../invoices/invoice.model");
  const PaymentTransaction = require("../transactions/transaction.model");
  const User = require("../auth/user.model");

  // Helper function to get client company IDs for a tenant
  const getClientCompanyIds = async (tenantCompanyId) => {
    const clientCompanies = await User.find({
      agencyId: tenantCompanyId,
      role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] }
    }).select("_id");
    return clientCompanies.map((cc) => cc._id);
  };

  const month = filters.month || new Date().getMonth() + 1;
  const year = filters.year || new Date().getFullYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all client companies for this tenant
  const clientCompanyIds = await getClientCompanyIds(companyId);

  // Get all invoices for this period (any invoice with salespersonId assigned)
  const invoices = await Invoice.find({
    companyId,
    clientId: { $in: clientCompanyIds },
    createdAt: { $gte: startDate, $lte: endDate },
    salespersonId: { $ne: null }, // Only invoices with assigned person
  })
    .populate("createdBy", "name email role team")
    .populate("salespersonId", "name email role team")
    .populate("clientId", "name");

  // Get all unique user IDs from invoices (salespersonId)
  const assignedUserIds = [
    ...new Set(
      invoices
        .map((inv) => inv.salespersonId?._id || inv.salespersonId)
        .filter(Boolean),
    ),
  ];

  // Get user details for all assigned persons
  const assignedUsers = await User.find({
    _id: { $in: assignedUserIds },
    companyId,
    isActive: true,
  }).select("_id name email role team");

  const assignedUserMap = new Map();
  assignedUsers.forEach((user) => {
    assignedUserMap.set(user._id.toString(), user);
  });

  // Get all payment transactions for these invoices
  const invoiceIds = invoices.map((inv) => inv._id);
  const payments = await PaymentTransaction.find({
    invoiceId: { $in: invoiceIds },
    status: { $ne: "rejected" },
  }).select("invoiceId amount");

  // Calculate totalPaid for each invoice
  const paymentMap = {};
  payments.forEach((payment) => {
    const invoiceId = payment.invoiceId.toString();
    if (!paymentMap[invoiceId]) {
      paymentMap[invoiceId] = 0;
    }
    paymentMap[invoiceId] += payment.amount || 0;
  });

  // Calculate invoice amounts by team and individual
  const invoiceAmountsByTeam = {};
  const invoiceAmountsByUser = {};
  let totalInvoiceAmount = 0;
  let totalCollectedAmount = 0;
  let totalPendingAmount = 0;

  invoices.forEach((invoice) => {
    const invoiceService = require("../invoices/invoice.service");
    const invoiceGrandTotal = invoiceService.getInvoiceGrandTotal(invoice);
    const invoiceId = invoice._id.toString();

    // Calculate paid amount - if status is 'paid', use grand total, otherwise use payment transactions
    let totalPaid = 0;
    if (invoice.status === "paid") {
      totalPaid = invoiceGrandTotal;
    } else {
      totalPaid = paymentMap[invoiceId] || 0;
    }

    const pendingAmount = Math.max(0, invoiceGrandTotal - totalPaid);

    totalInvoiceAmount += invoiceGrandTotal;
    totalCollectedAmount += totalPaid;
    totalPendingAmount += pendingAmount;

    // Attribute invoice to the assigned person (salespersonId)
    // This is the person selected in "Assigned Person" field
    const salesperson = invoice.salespersonId;

    if (!salesperson) {
      return; // Skip invoices without assigned person
    }

    // Get user details (handle both populated object and ID)
    let user = null;
    if (typeof salesperson === "object" && salesperson._id) {
      user = assignedUserMap.get(salesperson._id.toString()) || salesperson;
    } else {
      user = assignedUserMap.get(String(salesperson));
    }

    if (!user) {
      return; // Skip if user not found
    }

    const teamName = user?.team || "Individual";
    const userId = user._id.toString();

    // Group by team
    if (!invoiceAmountsByTeam[teamName]) {
      invoiceAmountsByTeam[teamName] = {
        total: 0,
        collected: 0,
        pending: 0,
      };
    }
    invoiceAmountsByTeam[teamName].total += invoiceGrandTotal;
    invoiceAmountsByTeam[teamName].collected += totalPaid;
    invoiceAmountsByTeam[teamName].pending += pendingAmount;

    // Group by user
    if (!invoiceAmountsByUser[userId]) {
      invoiceAmountsByUser[userId] = {
        total: 0,
        collected: 0,
        pending: 0,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
      };
    }
    invoiceAmountsByUser[userId].total += invoiceGrandTotal;
    invoiceAmountsByUser[userId].collected += totalPaid;
    invoiceAmountsByUser[userId].pending += pendingAmount;
  });

  // Calculate overall metrics
  const overallMetrics = {
    totalAmount: totalInvoiceAmount, // Total invoice amount
    totalAchieved: totalCollectedAmount, // Collected (paid) amount
    totalPending: totalPendingAmount, // Pending (unpaid) amount
    totalIncome: totalCollectedAmount, // Same as achieved (collected)
  };

  // Group by team
  const teamWise = {};

  Object.keys(invoiceAmountsByTeam).forEach((teamName) => {
    const teamData = invoiceAmountsByTeam[teamName];

    teamWise[teamName] = {
      team: teamName,
      totalAmount: teamData.total,
      totalAchieved: teamData.collected,
      totalPending: teamData.pending,
      totalIncome: teamData.collected,
    };
  });

  // Individual performance
  const individualTargets = Object.keys(invoiceAmountsByUser).map((userId) => {
    const userData = invoiceAmountsByUser[userId];

    return {
      _id: userId,
      userId: {
        _id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        team: userData.team,
      },
      totalAmount: userData.total,
      achievedAmount: userData.collected,
      pendingAmount: userData.pending,
      totalIncome: userData.collected,
    };
  });

  return {
    overallMetrics,
    teamWise: Object.values(teamWise),
    individual: individualTargets,
    period: { month, year },
  };
};

/**
 * Generate monthly sales report
 */
const generateMonthlyReport = async (companyId, month, year) => {
  const tracking = await getSalesTracking(companyId, { month, year });

  // Get detailed invoice data
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const invoices = await Invoice.find({
    companyId,
    invoiceDate: { $gte: startDate, $lte: endDate },
  })
    .populate("salespersonId", "name email role team")
    .populate("clientId", "name email")
    .sort({ invoiceDate: -1 });

  // Get expenses (Removed in new CRM)
  const expenses = [];

  // Get campaigns for this period (Removed in new CRM)
  const campaigns = [];

  // Get projects for this period
  const projects = await Project.find({
    companyId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("clientId", "name email")
    .populate("invoiceId", "invoiceNumber total")
    .sort({ createdAt: -1 });

  return {
    period: { month, year, startDate, endDate },
    summary: tracking.overallMetrics,
    teamWise: tracking.teamWise,
    individual: tracking.individual,
    departmentWise: tracking.departmentWise,
    invoices,
    campaigns,
    projects,
    expenses,
    generatedAt: new Date(),
  };
};

module.exports = {
  getTargets,
  createTarget,
  updateTarget,
  updateTargetOnPayment,
  recalculateTargetMetrics,
  getSalesTracking,
  generateMonthlyReport,
};
