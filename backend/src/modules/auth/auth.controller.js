const User = require('./user.model');
const Role = require('../roles/role.model');
const jwt = require('jsonwebtoken');

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email })
      .populate('agencyId', 'companyName name')
      .populate('brandId', 'companyName name');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email address' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Sign JWT token containing user role and mapping IDs
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role, 
        agencyId: user.agencyId ? user.agencyId._id : null,
        brandId: user.brandId ? user.brandId._id : null,
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
      { expiresIn: '7d' }
    );

    // If user is an agency manager or super admin, get their package features
    let features = [];
    let rolePermissions = {};
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency && agency.plan && agency.plan.features) {
        features = agency.plan.features;
      }
    }
    
    if (user.customRoleId) {
      const roleDoc = await Role.findById(user.customRoleId);
      if (roleDoc && roleDoc.permissions) {
        rolePermissions = roleDoc.permissions;
      }
    }

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        companyName: user.companyName,
        agencyId: user.agencyId ? user.agencyId._id : null,
        agencyName: user.agencyId ? (user.agencyId.companyName || user.agencyId.name) : null,
        brandId: user.brandId ? user.brandId._id : null,
        brandName: user.brandId ? (user.brandId.companyName || user.brandId.name) : null,
        workspaceId: user.workspaceId,
        features: features,
        permissions: rolePermissions
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.impersonate = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const requestor = req.user;

    if (!requestor) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const allowedImpersonators = ['agency_manager', 'brand_manager', 'commander_admin', 'superadmin', 'supreme_super_admin', 'agency_super_admin', 'brand_super_admin'];
    
    if (!allowedImpersonators.includes(requestor.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to impersonate users.' });
    }

    const user = await User.findById(targetUserId)
      .populate('agencyId', 'companyName name')
      .populate('brandId', 'companyName name');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role, 
        agencyId: user.agencyId ? user.agencyId._id : null,
        brandId: user.brandId ? user.brandId._id : null,
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
      { expiresIn: '7d' }
    );

    let features = [];
    let rolePermissions = {};
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency && agency.plan && agency.plan.features) {
        features = agency.plan.features;
      }
    }
    
    if (user.customRoleId) {
      const roleDoc = await Role.findById(user.customRoleId);
      if (roleDoc && roleDoc.permissions) {
        rolePermissions = roleDoc.permissions;
      }
    }

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        companyName: user.companyName,
        agencyId: user.agencyId ? user.agencyId._id : null,
        agencyName: user.agencyId ? (user.agencyId.companyName || user.agencyId.name) : null,
        brandId: user.brandId ? user.brandId._id : null,
        brandName: user.brandId ? (user.brandId.companyName || user.brandId.name) : null,
        workspaceId: user.workspaceId,
        features: features,
        permissions: rolePermissions
      }
    });
  } catch (error) {
    next(error);
  }
};
