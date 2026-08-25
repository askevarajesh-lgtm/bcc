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

    const { name, email, password, viewAllClients } = req.body;
    const role = 'agency_manager';

    // Fetch the agency user's plan to get limits
    const agencyUserDoc = await User.findById(agencyId).populate('plan');
    const baseUsersLimit = Number(agencyUserDoc?.plan?.users || agencyUserDoc?.allowedUsers || 5);
    const extraUsersLimit = Number(agencyUserDoc?.extraUsers || 0);
    const maxUsers = baseUsersLimit + extraUsersLimit;

    // Count existing agency team members
    const currentUsersCount = await User.countDocuments({
      agencyId,
      brandId: null,
      _id: { $ne: agencyId },
      role: { $in: ['agency_manager', 'user'] }
    });

    if (currentUsersCount >= maxUsers) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have reached the maximum limit allowed by your current package. If you need additional capacity, please raise a support ticket or upgrade your package.'
      });
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
      agencyId,
      viewAllClients: viewAllClients === true
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

// Update an agency user
exports.updateAgencyUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'agency_super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, phone, viewAllClients } = req.body;
    let updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (viewAllClients !== undefined) updateFields.viewAllClients = viewAllClients === true;
    
    // We only allow name and phone update for sub-users for now. 
    // If they provided a new password, hash it and add it
    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, agencyId: req.user.agencyId },
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
