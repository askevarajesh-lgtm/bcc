const User = require('../auth/user.model');

// Get all sub-users for an agency
exports.getAgencyUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'agency_super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const agencyId = req.user.agencyId;
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'No agency associated' });
    }

    // Find users belonging to this agency that are either agency_manager or agency_super_admin
    const users = await User.find({ 
      agencyId,
      role: { $in: ['agency_manager', 'agency_super_admin'] }
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// Create a new agency sub-user
exports.createAgencyUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'agency_super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const agencyId = req.user.agencyId;
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'No agency associated' });
    }

    const { name, email, password, role } = req.body;

    // Verify role is valid for this context
    if (!['agency_manager', 'agency_super_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selection' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      agencyId
    });

    res.status(201).json({ success: true, data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }});
  } catch (error) {
    next(error);
  }
};

// Delete an agency user
exports.deleteAgencyUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'agency_super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Prevent deleting self
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findOneAndDelete({ 
      _id: req.params.id, 
      agencyId: req.user.agencyId 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
