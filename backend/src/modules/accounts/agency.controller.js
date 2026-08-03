const User = require('../auth/user.model');

exports.getAgencies = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
    let filter = { role: { $in: [targetRole] } };
    if (req.user && req.user.role === 'commander_admin') {
      filter.createdBy = req.user._id;
    }
    const agencies = await User.find(filter).populate('plan').sort({ createdAt: -1 });

    const data = await Promise.all(agencies.map(async (agency) => {
      const usersCount = await User.countDocuments({
        agencyId: agency._id,
        brandId: null, // Ensure we do not count brand users
        _id: { $ne: agency._id }, // Exclude the agency admin itself
        role: { $in: ['agency_manager', 'user'] }
      });
      const clientsCount = await User.countDocuments({
        agencyId: agency._id,
        role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] },
        isDirect: false
      });
      
      return {
        ...agency.toObject(),
        usersCount,
        clientsCount
      };
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

exports.getAgency = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
    const agency = await User.findOne({ _id: req.params.id, role: { $in: [targetRole] } });
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, data: agency });
  } catch (error) {
    next(error);
  }
};

exports.createAgency = async (req, res, next) => {
  try {
    const { name, email, password, package: packageId, plan, status } = req.body;
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Fetch the selected package to get features and user limits
    let packageFeatures = [];
    let packageUsers = 5;
    if (plan || packageId) {
      const AgencyPackage = require('../agencyPackages/agencyPackage.model');
      const pkg = await AgencyPackage.findById(plan || packageId);
      if (pkg) {
        packageFeatures = pkg.features || [];
        packageUsers = pkg.users || 5;
        
        const now = new Date();
        req.body.subscriptionStartDate = now;
        req.body.billingInterval = pkg.billingInterval || 'Monthly';
        
        if (req.body.billingInterval === 'Monthly') {
          req.body.subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (req.body.billingInterval === 'Yearly') {
          req.body.subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else {
          req.body.subscriptionEndDate = null; // One Time
        }
      }
    }

    // Create the Company/Agency
    const agencyUser = await User.create({
      name: name + ' Admin',
      email,
      password: password || undefined,
      role: targetRole,
      companyName: name,
      plan: plan || packageId || null,
      status: status || 'active',
      features: req.body.features || packageFeatures,
      allowedUsers: packageUsers,
      subscriptionStartDate: req.body.subscriptionStartDate,
      subscriptionEndDate: req.body.subscriptionEndDate,
      billingInterval: req.body.billingInterval,
      createdBy: req.user ? req.user._id : undefined
    });

    agencyUser.agencyId = agencyUser._id;
    await agencyUser.save();

    // Dispatch system notification
    const { dispatchSystemNotification } = require('../tasks/notification.service');
    const companyId = req.user?.workspaceId || agencyUser._id;
    if (companyId) {
      await dispatchSystemNotification(
        companyId,
        'agencyCreated',
        'agency_created',
        'New Agency Created',
        `Agency ${agencyUser.companyName} (${agencyUser.email}) has been created.`,
        { agencyId: agencyUser._id }
      );
    }

    res.status(201).json({ success: true, data: agencyUser });
  } catch (error) {
    next(error);
  }
};

exports.updateAgency = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
    if (req.body.package && !req.body.plan) {
      req.body.plan = req.body.package;
      delete req.body.package;
    }
    
    const agency = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: [targetRole] } },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, data: agency });
  } catch (error) {
    next(error);
  }
};

exports.deleteAgency = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
    const agency = await User.findOneAndDelete({ _id: req.params.id, role: { $in: [targetRole] } });
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    // Also delete all users associated with this agency
    await User.deleteMany({ agencyId: agency._id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const agencyId = req.user.agencyId || req.user._id;

    // 1. Calculate Agency MRR (Sum of MRR from all clients)
    const clients = await User.find({
      agencyId,
      role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] },
      status: 'active'
    });
    
    let totalMrr = 0;
    clients.forEach(c => {
      totalMrr += c.mrr || 0;
    });
    const activeClientsCount = clients.length;

    // 2. Count Team Members (Excluding clients)
    const teamMembersCount = await User.countDocuments({
      $or: [{ agencyId }, { _id: agencyId }],
      brandId: null,
      role: { $nin: ['brand_super_admin', 'brand_manager', 'agency_client', 'superadmin', 'supreme_super_admin'] }
    });

    // 3. Team Performance (List of Agency Managers)
    const managers = await User.find({
      $or: [{ agencyId }, { _id: agencyId }],
      role: 'agency_manager'
    }).select('name email phone role roleName status');

    const teamPerformance = managers.map(m => ({
      key: m._id,
      name: m.name,
      email: m.email,
      phone: m.phone || 'N/A',
      role: m.roleName || 'Agency Manager',
      status: m.status === 'active' ? 'Active' : 'Inactive'
    }));

    // 4. Invoices Calculation
    const Invoice = require('../invoices/invoice.model');
    const invoices = await Invoice.find({
      agencyId,
      isDeleted: false
    });

    let totalInvoiceAmount = 0;
    let totalPaidAmount = 0;
    let pendingAmount = 0;

    invoices.forEach(inv => {
      totalInvoiceAmount += inv.grandTotal || 0;
      totalPaidAmount += inv.totalPaid || 0;
      pendingAmount += inv.pendingAmount || 0;
    });

    // We can define Revenue as Total Paid Amount + MRR (or just Total Paid for now)
    const revenue = totalPaidAmount;

    // 5. Chart Data (Revenue per month for the last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartDataMap = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      chartDataMap[`${d.getFullYear()}-${d.getMonth()}`] = {
        name: monthNames[d.getMonth()],
        revenue: 0,
        sortOrder: d.getTime()
      };
    }

    invoices.forEach(inv => {
      if (inv.createdAt) {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (chartDataMap[key] !== undefined) {
          chartDataMap[key].revenue += inv.totalPaid || 0;
        }
      }
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.sortOrder - b.sortOrder).map(item => ({
      name: item.name,
      revenue: item.revenue
    }));

    // 6. Recent Activities
    const recentActivities = [];
    
    // Recent Clients
    const recentClients = await User.find({
      agencyId,
      role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] },
      status: 'active'
    }).sort({ createdAt: -1 }).limit(3);
    
    recentClients.forEach(c => {
      recentActivities.push({
        id: `client_${c._id}`,
        title: `New Client Onboarded: ${c.name || c.companyName}`,
        time: c.createdAt ? c.createdAt.toDateString() : 'Recently',
        type: 'client',
        createdAt: c.createdAt
      });
    });

    // Recent Invoices
    const recentInvoices = invoices.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 3);

    recentInvoices.forEach(inv => {
      recentActivities.push({
        id: `invoice_${inv._id}`,
        title: `Invoice ${inv.invoiceNumber} Generated`,
        time: inv.createdAt ? inv.createdAt.toDateString() : 'Recently',
        type: 'invoice',
        createdAt: inv.createdAt
      });
    });

    // Sort combined activities by date
    recentActivities.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

    res.status(200).json({
      success: true,
      data: {
        agencyMrr: `₹${(totalMrr / 100000).toFixed(1)}L`,
        grossMargin: 'N/A', // Cannot be computed without costs
        activeClients: activeClientsCount,
        teamMembers: teamMembersCount,
        totalInvoiceAmount: formatCurrency(totalInvoiceAmount),
        totalPaidAmount: formatCurrency(totalPaidAmount),
        pendingAmount: formatCurrency(pendingAmount),
        revenue: formatCurrency(revenue),
        teamPerformance,
        chartData,
        recentActivities: recentActivities.slice(0, 5) // Return top 5
      }
    });
  } catch (error) {
    next(error);
  }
};
