const User = require('./user.model');

exports.getUsers = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (req.query.role) queryFilter.role = req.query.role;
    
    // If user is a brand admin/manager, only return users for their brand
    if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      queryFilter.brandId = req.user.brandId;
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
    }

    const users = await User.find(queryFilter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const userData = { ...req.body };
    
    // If created by a brand admin, automatically assign their brandId and agencyId
    if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      userData.brandId = req.user.brandId;
      userData.agencyId = req.user.agencyId;
      
      // Ensure they can't create roles higher than themselves
      if (!['brand_manager', 'brand_team_user'].includes(userData.role)) {
         userData.role = 'brand_team_user';
      }
    }

    const user = await User.create(userData);
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    // Prevent password update through this route
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
