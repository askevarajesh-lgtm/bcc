const User = require('./user.model');
const Role = require('../roles/role.model');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../../utils/sendpulse.service');


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

const getEffectiveLogo = async (user) => {
  let effectiveLogo = null;
  try {
    if (user.logo) {
      effectiveLogo = user.logo;
    } else if (user.brandId && user.brandId.logo) {
      effectiveLogo = user.brandId.logo;
    } else if (user.agencyId && user.agencyId.logo) {
      effectiveLogo = user.agencyId.logo;
    } else {
      const commander = await User.findOne({ role: 'commander_admin' }).select('logo');
      if (commander && commander.logo) {
        effectiveLogo = commander.logo;
      }
    }
  } catch (e) {
    console.error('Error resolving logo:', e);
  }
  return effectiveLogo;
};

const getEffectiveLogoDark = async (user) => {
  let effectiveLogoDark = null;
  try {
    if (user.logoDark) {
      effectiveLogoDark = user.logoDark;
    } else if (user.brandId && user.brandId.logoDark) {
      effectiveLogoDark = user.brandId.logoDark;
    } else if (user.agencyId && user.agencyId.logoDark) {
      effectiveLogoDark = user.agencyId.logoDark;
    } else {
      const commander = await User.findOne({ role: 'commander_admin' }).select('logoDark');
      if (commander && commander.logoDark) {
        effectiveLogoDark = commander.logoDark;
      }
    }
  } catch (e) {
    console.error('Error resolving logoDark:', e);
  }
  return effectiveLogoDark;
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
      .populate('agencyId', 'companyName name logo logoDark status theme')
      .populate('brandId', 'companyName name logo logoDark status features integrations theme')
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
    // Package-level integration entitlements (Layer 2 -- see
    // backend/src/utils/integrationAccess.js). Resolved the same way as
    // `features` above: own snapshot first, falling back to the live
    // Package.integrations when the snapshot is empty.
    let integrations = user.integrations || [];
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

        if (agency.integrations && agency.integrations.length > 0) {
          integrations = agency.integrations;
        } else if (agency.plan) {
          integrations = agency.plan.integrations || [];
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

    if (user.brandId && user.brandId.integrations && user.brandId.integrations.length > 0) {
      integrations = Array.from(new Set([...integrations, ...user.brandId.integrations]));
    }

    const Package = require('../packages/package.model');

    const resolveBrandPackage = async (packageName) => {
      let pkg = await Package.findOne({ type: 'directClient', name: packageName });
      if (!pkg) {
        pkg = await Package.findOne({ type: 'client', name: packageName });
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
    const effectiveLogo = await getEffectiveLogo(user);
    const effectiveLogoDark = await getEffectiveLogoDark(user);

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
        logo: effectiveLogo,
        logoDark: effectiveLogoDark,
        contactEmail: user.contactEmail,
        domain: user.domain,
        industry: user.industry,
        workspaceId: user.workspaceId,
        features: features,
        integrations: integrations,
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
      .populate('agencyId', 'companyName name logo logoDark status theme')
      .populate('brandId', 'companyName name logo logoDark domain contactEmail industry features integrations theme')
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
    // Package-level integration entitlements (Layer 2 -- see
    // backend/src/utils/integrationAccess.js). Resolved the same way as
    // `features` above: own snapshot first, falling back to the live
    // Package.integrations when the snapshot is empty.
    let integrations = user.integrations || [];
    let rolePermissions = {};
    let planDetails = null;
    let brandPackageDetails = null;
    let agencyFeatures = [];
    let agencyIntegrations = [];

    if (user.agencyId) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency) {
        if (agency.features && agency.features.length > 0) {
          agencyFeatures = agency.features;
        } else if (agency.plan) {
          agencyFeatures = agency.plan.features || [];
        }

        if (agency.integrations && agency.integrations.length > 0) {
          agencyIntegrations = agency.integrations;
        } else if (agency.plan) {
          agencyIntegrations = agency.plan.integrations || [];
        }

        if (user.role === 'agency_manager' || user.role === 'agency_super_admin') {
          features = agencyFeatures;
          integrations = agencyIntegrations;
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

    if (user.brandId && user.brandId.integrations && user.brandId.integrations.length > 0) {
      integrations = Array.from(new Set([...integrations, ...user.brandId.integrations]));
    }

    const effectiveTheme = await getEffectiveTheme(user);
    const effectiveLogo = await getEffectiveLogo(user);
    const effectiveLogoDark = await getEffectiveLogoDark(user);

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
        logo: effectiveLogo,
        logoDark: effectiveLogoDark,
        contactEmail: user.contactEmail || (user.brandId ? user.brandId.contactEmail : null),
        domain: user.domain || (user.brandId ? user.brandId.domain : null),
        industry: user.industry || (user.brandId ? user.brandId.industry : null),
        workspaceId: user.workspaceId,
        features: features,
        agencyFeatures: agencyFeatures,
        integrations: integrations,
        agencyIntegrations: agencyIntegrations,
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
      .populate('agencyId', 'companyName name logo logoDark status')
      .populate('brandId', 'companyName name logo logoDark status features integrations')
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
    // Package-level integration entitlements (Layer 2 -- see
    // backend/src/utils/integrationAccess.js), resolved the same way as
    // `features` above.
    let integrations = user.integrations || [];
    let rolePermissions = {};
    let planDetails = null;
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await User.findById(user.agencyId._id).populate('plan');
      if (agency && agency.plan) {
        features = agency.plan.features || [];
        integrations = agency.plan.integrations || [];
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

    if (user.brandId && user.brandId.integrations && user.brandId.integrations.length > 0) {
      integrations = Array.from(new Set([...integrations, ...user.brandId.integrations]));
    }

    const Package = require('../packages/package.model');

    let brandPackageDetails = null;
    
    const resolveBrandPackageImp = async (packageName) => {
      let pkg = await Package.findOne({ type: 'directClient', name: packageName });
      if (!pkg) {
        pkg = await Package.findOne({ type: 'client', name: packageName });
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
    const effectiveLogo = await getEffectiveLogo(user);
    const effectiveLogoDark = await getEffectiveLogoDark(user);

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
        logo: effectiveLogo,
        logoDark: effectiveLogoDark,
        contactEmail: user.contactEmail || (user.brandId ? user.brandId.contactEmail : null),
        domain: user.domain || (user.brandId ? user.brandId.domain : null),
        industry: user.industry || (user.brandId ? user.brandId.industry : null),
        workspaceId: user.workspaceId,
        features: features,
        integrations: integrations,
        permissions: rolePermissions,
        plan: planDetails,
        effectiveTheme
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User with this email not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent successfully to your email' });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpiry)) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpiry)) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};