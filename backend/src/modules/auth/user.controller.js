const User = require('./user.model');
const Role = require('../roles/role.model');
const Department = require('../departments/department.model');

const SYSTEM_ROLES = [
  'supreme_super_admin',
  'commander_admin',
  'agency_super_admin',
  'agency_manager',
  'agency_client',
  'brand_super_admin',
  'brand_manager',
  'user'
];

const validRolesForAdmin = [
  'commander_admin',
  'agency_super_admin',
  'agency_manager',
  'agency_client',
  'brand_super_admin',
  'brand_manager',
  'user'
];

exports.getUsers = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (req.query.role) queryFilter.role = req.query.role;
    
    // If user is commander_admin, only return users they created
    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      // If user is a brand admin/manager, only return users for their brand
      queryFilter.brandId = req.user.brandId;
      if (req.user.role === 'brand_manager') {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'brand_super_admin'] };
      } else {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin'] };
      }
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
      if (req.user.role === 'agency_manager') {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin'] };
      } else {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin'] };
      }
    }

    const users = await User.find(queryFilter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUsersDropdown = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (req.query.role) queryFilter.role = req.query.role;
    
    // If user is commander_admin, only return users they created
    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      queryFilter.brandId = req.user.brandId;
      if (req.user.role === 'brand_manager') {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'brand_super_admin'] };
      } else {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin'] };
      }
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
      if (req.user.role === 'agency_manager') {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin', 'agency_super_admin'] };
      } else {
        queryFilter.role = { $nin: ['supreme_super_admin', 'commander_admin'] };
      }
    }

    const users = await User.find(queryFilter).select('name email role').sort({ name: 1 });
    res.status(200).json({ success: true, data: { users } });
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
    
    // Check for Two-Tier Role Mapping
    let incomingRole = userData.role;
    if (incomingRole && !SYSTEM_ROLES.includes(incomingRole)) {
      // It's a dynamic custom role, look it up
      const customRole = await Role.findOne({ roleKey: incomingRole });
      if (customRole) {
        userData.customRoleId = customRole._id;
        userData.roleName = customRole.roleName;
      }
    } else if (incomingRole && SYSTEM_ROLES.includes(incomingRole)) {
      userData.roleName = incomingRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    if (userData.departmentId) {
      const dept = await Department.findById(userData.departmentId);
      if (dept) userData.departmentName = dept.name;
    }

    // Default System Role Mapping based on Creator
    if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      userData.brandId = req.user.brandId;
      userData.agencyId = req.user.agencyId;
      
      if (req.user.role === 'brand_super_admin') {
         userData.role = 'brand_manager'; // Brand Super Admin always creates Brand Managers
      } else {
         userData.role = 'user'; // Brand Manager creates generic users (customRole determines their job)
      }
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role)) {
      // If created by an agency admin, assign agencyId
      userData.agencyId = req.user.agencyId || req.user._id; 
      if (req.user.adminId) userData.adminId = req.user.adminId;
      
      // If custom role, base access is user
      if (!SYSTEM_ROLES.includes(incomingRole)) userData.role = 'user'; 
      else if (!userData.role) userData.role = 'user';
      
    } else if (req.user.role === 'commander_admin') {
      // Commander Admin can create roles in validRolesForAdmin
      userData.adminId = req.user._id;
      if (!SYSTEM_ROLES.includes(incomingRole)) userData.role = 'user';
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
    
    // Check for Two-Tier Role Mapping during update
    if (updateData.role && !SYSTEM_ROLES.includes(updateData.role)) {
      const customRole = await Role.findOne({ roleKey: updateData.role });
      if (customRole) {
        updateData.customRoleId = customRole._id;
        updateData.roleName = customRole.roleName;
        
        // Preserve their system tier base role based on current user context
        if (['agency_super_admin', 'agency_manager'].includes(req.user.role)) {
          updateData.role = 'agency_manager';
        } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
          updateData.role = 'user';
        } else {
          updateData.role = 'user';
        }
      }
    } else if (updateData.role && SYSTEM_ROLES.includes(updateData.role)) {
      // If they switch back to a system role, clear the custom role
      updateData.customRoleId = null;
      updateData.roleName = updateData.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    if (updateData.departmentId) {
      const dept = await Department.findById(updateData.departmentId);
      if (dept) updateData.departmentName = dept.name;
    }

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
