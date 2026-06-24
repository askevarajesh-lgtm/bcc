const User = require('../auth/user.model');

exports.getAgencies = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
    const agencies = await User.find({ role: { $in: [targetRole] } }).populate('plan').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: agencies.length, data: agencies });
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

    // Create the Company/Agency
    const agencyUser = await User.create({
      name: name + ' Admin',
      email,
      password: password || undefined,
      role: targetRole,
      companyName: name,
      plan: plan || packageId || null,
      status: status || 'active'
    });

    agencyUser.agencyId = agencyUser._id;
    await agencyUser.save();

    res.status(201).json({ success: true, data: agencyUser });
  } catch (error) {
    next(error);
  }
};

exports.updateAgency = async (req, res, next) => {
  try {
    const targetRole = req.user && req.user.role === 'commander_admin' ? 'agency_super_admin' : 'commander_admin';
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
