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
      .populate('agencyId', 'companyName name logo status')
      .populate('brandId', 'companyName name logo');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email address' });
    }

    if (user.status === 'suspended' || (user.agencyId && user.agencyId.status === 'suspended')) {
      return res.status(403).json({ success: false, error: 'Your Agency has been suspended. Please contact your Administrator or Support Team for further assistance.' });
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

    let features = user.features || [];
    let rolePermissions = {};
    let planDetails = null;
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency) {
        if (agency.features && agency.features.length > 0) {
          features = agency.features;
        } else if (agency.plan) {
          features = agency.plan.features || [];
        }

        if (agency.plan) {
          planDetails = {
            name: agency.plan.name,
            price: agency.plan.price,
            description: agency.plan.description,
            users: agency.plan.users,
            clients: agency.plan.clients,
            createdAt: agency.plan.createdAt
          };
        }
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
        logo: user.logo || (user.agencyId ? user.agencyId.logo : null) || (user.brandId ? user.brandId.logo : null),
        contactEmail: user.contactEmail,
        domain: user.domain,
        industry: user.industry,
        workspaceId: user.workspaceId,
        features: features,
        permissions: rolePermissions,
        plan: planDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('agencyId', 'companyName name logo status')
      .populate('brandId', 'companyName name logo domain contactEmail industry');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.status === 'suspended' || (user.agencyId && user.agencyId.status === 'suspended')) {
      return res.status(403).json({ success: false, error: 'Your Agency has been suspended. Please contact your Administrator or Support Team for further assistance.' });
    }

    let features = user.features || [];
    let rolePermissions = {};
    let planDetails = null;
    let agencyFeatures = [];

    if (user.agencyId) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency) {
        if (agency.features && agency.features.length > 0) {
          agencyFeatures = agency.features;
        } else if (agency.plan) {
          agencyFeatures = agency.plan.features || [];
        }

        if (user.role === 'agency_manager' || user.role === 'agency_super_admin') {
          features = agencyFeatures;
          if (agency.plan) {
            planDetails = {
              name: agency.plan.name,
              price: agency.plan.price,
              description: agency.plan.description,
              users: agency.plan.users,
              clients: agency.plan.clients,
              createdAt: agency.plan.createdAt
            };
          }
        }
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
        logo: user.logo || (user.agencyId ? user.agencyId.logo : null) || (user.brandId ? user.brandId.logo : null),
        contactEmail: user.contactEmail || (user.brandId ? user.brandId.contactEmail : null),
        domain: user.domain || (user.brandId ? user.brandId.domain : null),
        industry: user.industry || (user.brandId ? user.brandId.industry : null),
        workspaceId: user.workspaceId,
        features: features,
        agencyFeatures: agencyFeatures,
        packageName: user.packageName,
        createdAt: user.createdAt,
        permissions: rolePermissions,
        plan: planDetails
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
      .populate('agencyId', 'companyName name logo')
      .populate('brandId', 'companyName name logo');

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

    let features = user.features || [];
    let rolePermissions = {};
    let planDetails = null;
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency && agency.plan) {
        features = agency.plan.features || [];
        planDetails = {
          name: agency.plan.name,
          price: agency.plan.price,
          description: agency.plan.description,
          users: agency.plan.users,
          clients: agency.plan.clients,
          createdAt: agency.plan.createdAt
        };
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
        logo: user.logo || (user.agencyId ? user.agencyId.logo : null) || (user.brandId ? user.brandId.logo : null),
        contactEmail: user.contactEmail || (user.brandId ? user.brandId.contactEmail : null),
        domain: user.domain || (user.brandId ? user.brandId.domain : null),
        industry: user.industry || (user.brandId ? user.brandId.industry : null),
        workspaceId: user.workspaceId,
        features: features,
        permissions: rolePermissions,
        plan: planDetails
      }
    });
  } catch (error) {
    next(error);
  }
};
