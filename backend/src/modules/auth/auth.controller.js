const User = require('./user.model');
const Role = require('../roles/role.model');
const jwt = require('jsonwebtoken');

const getEffectiveTheme = async (user) => {
  let effectiveTheme = { primaryColor: '#034EA1', secondaryColor: '#0ea5e9' };
  try {
    const commander = await User.findOne({ role: 'commander_admin' }).select('theme');
    if (commander && commander.theme && commander.theme.primaryColor) {
      effectiveTheme = commander.theme;
    }
    if (user.agencyId && user.agencyId.theme && user.agencyId.theme.primaryColor) {
      effectiveTheme = user.agencyId.theme;
    }
    if (user.brandId && user.brandId.theme && user.brandId.theme.primaryColor) {
      effectiveTheme = user.brandId.theme;
    }
    if (user.theme && user.theme.primaryColor) {
      effectiveTheme = user.theme;
    }
  } catch (e) {
    console.error('Error resolving theme:', e);
  }
  return effectiveTheme;
};

exports.getGlobalTheme = async (req, res, next) => {
  try {
    let globalTheme = { primaryColor: '#034EA1', secondaryColor: '#0ea5e9' };
    const commander = await User.findOne({ role: 'commander_admin' }).select('theme');
    if (commander && commander.theme && commander.theme.primaryColor) {
      globalTheme = commander.theme;
    }
    res.status(200).json({ success: true, theme: globalTheme });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch global theme' });
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email })
      .populate('agencyId', 'companyName name logo status theme')
      .populate('brandId', 'companyName name logo status features theme')
      .populate('adminId', 'status');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email address' });
    }

    const isBlocked = (status) => ['suspended', 'inactive', 'churned'].includes(status);
    if (
      isBlocked(user.status) || 
      (user.agencyId && isBlocked(user.agencyId.status)) ||
      (user.brandId && isBlocked(user.brandId.status)) ||
      (user.adminId && isBlocked(user.adminId.status))
    ) {
      return res.status(403).json({ success: false, error: 'Your account or organization has been suspended or is inactive. Please contact your Administrator for further assistance.' });
    }

    const checkSubscriptionExpired = (targetUser) => {
      if (targetUser && targetUser.subscriptionEndDate) {
        return Date.now() > new Date(targetUser.subscriptionEndDate).getTime();
      }
      return false;
    };

    if (
      checkSubscriptionExpired(user) ||
      (user.agencyId && checkSubscriptionExpired(user.agencyId)) ||
      (user.brandId && checkSubscriptionExpired(user.brandId))
    ) {
      return res.status(403).json({ success: false, error: 'Your subscription has expired. Please renew your package to continue access.' });
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

    if (user.brandId && user.brandId.features && user.brandId.features.length > 0) {
      features = Array.from(new Set([...features, ...user.brandId.features]));
    }

    const DirectClientPackage = require('../agencyPackages/directClientPackage.model');
    const ClientPackage = require('../agencyPackages/clientPackage.model');
    
    const resolveBrandPackage = async (packageName) => {
      let pkg = await DirectClientPackage.findOne({ name: packageName });
      if (!pkg) {
        pkg = await ClientPackage.findOne({ name: packageName });
      }
      if (pkg) {
        return { name: pkg.name, price: pkg.price, billingInterval: pkg.billingInterval, userCount: pkg.userCount, description: pkg.description, features: pkg.features };
      }
      return null;
    };

    if (user.role === 'brand_super_admin' && user.packageName) {
      brandPackageDetails = await resolveBrandPackage(user.packageName);
    } else if (user.brandId) {
      const brandSuperAdmin = await User.findById(user.brandId._id);
      if (brandSuperAdmin && brandSuperAdmin.packageName) {
        brandPackageDetails = await resolveBrandPackage(brandSuperAdmin.packageName);
      }
    }

    const effectiveTheme = await getEffectiveTheme(user);

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
        plan: planDetails,
        effectiveTheme
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('agencyId', 'companyName name logo status theme')
      .populate('brandId', 'companyName name logo domain contactEmail industry features theme')
      .populate('adminId', 'status');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isBlocked = (status) => ['suspended', 'inactive', 'churned'].includes(status);
    if (
      isBlocked(user.status) || 
      (user.agencyId && isBlocked(user.agencyId.status)) ||
      (user.brandId && isBlocked(user.brandId.status)) ||
      (user.adminId && isBlocked(user.adminId.status))
    ) {
      return res.status(403).json({ success: false, error: 'Your account or organization has been suspended or is inactive. Please contact your Administrator for further assistance.' });
    }

    let features = user.features || [];
    let rolePermissions = {};
    let planDetails = null;
    let brandPackageDetails = null;
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

    if (user.brandId && user.brandId.features && user.brandId.features.length > 0) {
      features = Array.from(new Set([...features, ...user.brandId.features]));
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
        plan: planDetails,
        brandPackageDetails,
        effectiveTheme
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
      .populate('agencyId', 'companyName name logo status')
      .populate('brandId', 'companyName name logo status features')
      .populate('adminId', 'status');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const isBlocked = (status) => ['suspended', 'inactive', 'churned'].includes(status);
    if (
      isBlocked(user.status) || 
      (user.agencyId && isBlocked(user.agencyId.status)) ||
      (user.brandId && isBlocked(user.brandId.status)) ||
      (user.adminId && isBlocked(user.adminId.status))
    ) {
      return res.status(403).json({ success: false, error: 'The target account or organization has been suspended or is inactive.' });
    }

    const checkSubscriptionExpired = (targetUser) => {
      if (targetUser && targetUser.subscriptionEndDate) {
        return Date.now() > new Date(targetUser.subscriptionEndDate).getTime();
      }
      return false;
    };

    if (
      checkSubscriptionExpired(user) ||
      (user.agencyId && checkSubscriptionExpired(user.agencyId)) ||
      (user.brandId && checkSubscriptionExpired(user.brandId))
    ) {
      return res.status(403).json({ success: false, error: 'Your subscription has expired. Please renew your package to continue access.' });
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

    if (user.brandId && user.brandId.features && user.brandId.features.length > 0) {
      features = Array.from(new Set([...features, ...user.brandId.features]));
    }

    const DirectClientPackage = require('../agencyPackages/directClientPackage.model');
    const ClientPackage = require('../agencyPackages/clientPackage.model');
    
    let brandPackageDetails = null;
    
    const resolveBrandPackageImp = async (packageName) => {
      let pkg = await DirectClientPackage.findOne({ name: packageName });
      if (!pkg) {
        pkg = await ClientPackage.findOne({ name: packageName });
      }
      if (pkg) {
        return { name: pkg.name, price: pkg.price, billingInterval: pkg.billingInterval, userCount: pkg.userCount, description: pkg.description, features: pkg.features };
      }
      return null;
    };

    if (user.role === 'brand_super_admin' && user.packageName) {
      brandPackageDetails = await resolveBrandPackageImp(user.packageName);
    } else if (user.brandId) {
      const brandSuperAdmin = await User.findById(user.brandId._id);
      if (brandSuperAdmin && brandSuperAdmin.packageName) {
        brandPackageDetails = await resolveBrandPackageImp(brandSuperAdmin.packageName);
      }
    }

    const effectiveTheme = await getEffectiveTheme(user);

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
        plan: planDetails,
        effectiveTheme
      }
    });
  } catch (error) {
    next(error);
  }
};
