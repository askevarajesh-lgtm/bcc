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
      { new: true, runValidators: true }
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
    }).select('name role roleName status mrr');

    const teamPerformance = managers.map(m => ({
      key: m._id,
      name: m.name,
      role: m.roleName || 'Agency Manager',
      clients: 0, // Not tracked yet in schema
      mrr: `₹${((m.mrr || 0) / 100000).toFixed(1)}L`, // Just formatting
      mos: 100, // Placeholder
      status: m.status === 'active' ? 'Excellent' : 'Good'
    }));

    res.status(200).json({
      success: true,
      data: {
        agencyMrr: `₹${(totalMrr / 100000).toFixed(1)}L`,
        grossMargin: 'N/A', // Cannot be computed without costs
        activeClients: activeClientsCount,
        teamMembers: teamMembersCount,
        teamPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};
