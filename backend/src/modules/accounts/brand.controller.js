const User = require('../auth/user.model');

// Get all brands/companies for the current agency
exports.getBrands = async (req, res, next) => {
  try {
    const isAdmin = ['supreme_super_admin', 'commander_admin'].includes(req.user.role);
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(req.user.role);

    if (!isAdmin && !isAgency) {
      return res.status(403).json({ success: false, message: 'Not authorized to access brands' });
    }

    let filter = { role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };

    if (isAgency) {
      const agencyId = req.user.agencyId;
      if (!agencyId) {
        return res.status(400).json({ success: false, message: 'No agency associated with this user' });
      }
      filter.agencyId = agencyId;
    } else {
      filter.isDirect = true;
      if (req.user && req.user.role === 'commander_admin') {
        filter.createdBy = req.user._id;
      }
    }

    const brands = await User.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name role roleName');

    // Combine data
    const data = brands.map(brand => {
      return {
        ...brand.toObject(),
        adminEmail: brand.email,
      };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// Create a new brand/company and its agency manager user
exports.createBrand = async (req, res, next) => {
  try {
    const { name, email, password, packageName, features, mrr } = req.body;

    const isAdmin = ['supreme_super_admin', 'commander_admin'].includes(req.user.role);
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(req.user.role);

    if (!isAdmin && !isAgency) {
      return res.status(403).json({ success: false, message: 'Not authorized to create companies' });
    }

    let agencyId = null;
    let isDirect = false;

    if (isAgency) {
      agencyId = req.user.agencyId;
      if (!agencyId) {
        return res.status(400).json({ success: false, message: 'No agency associated with this user' });
      }

      // Check clients limit
      const agencyUserDoc = await User.findById(agencyId).populate('plan');
      const maxClients = agencyUserDoc?.plan?.clients || 10;

      const currentClientsCount = await User.countDocuments({
        agencyId,
        role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] },
        isDirect: false
      });

      if (currentClientsCount >= maxClients) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have reached the maximum limit allowed by your current package. If you need additional capacity, please raise a support ticket or upgrade your package.'
        });
      }
    } else {
      isDirect = true;
    }

    // Check if user with this email already exists
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
    }

    // Create the User for this brand (which IS the Brand)
    const brand = await User.create({
      name: name + ' Admin',
      email,
      password: password || undefined,
      role: isAgency ? 'agency_client' : (isAdmin ? 'brand_super_admin' : 'brand_manager'),
      agencyId, // Null for direct brands
      companyName: name,
      isDirect,
      packageName: packageName || null,
      features: features || [],
      mrr: mrr || 0,
      createdBy: req.user._id
    });

    brand.brandId = brand._id;
    await brand.save();

    // Dispatch system notification
    const { dispatchSystemNotification } = require('../tasks/notification.service');
    const companyId = req.user?.workspaceId || agencyId || brand._id;
    if (companyId) {
      await dispatchSystemNotification(
        companyId,
        'brandCreated',
        'brand_created',
        'New Brand Created',
        `Brand ${brand.companyName} (${brand.email}) has been created.`,
        { brandId: brand._id }
      );
    }

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// Update brand status
exports.updateBrandStatus = async (req, res, next) => {
  try {
    const isAdmin = ['supreme_super_admin', 'commander_admin'].includes(req.user.role);
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(req.user.role);

    if (!isAdmin && !isAgency) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let filter = { _id: req.params.id, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
    if (isAgency) {
      filter.agencyId = req.user.agencyId;
    } else {
      filter.isDirect = true;
    }

    const { status } = req.body;
    const brand = await User.findOneAndUpdate(
      filter,
      { status },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// Delete brand
exports.deleteBrand = async (req, res, next) => {
  try {
    const isAdmin = ['supreme_super_admin', 'commander_admin'].includes(req.user.role);
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(req.user.role);

    if (!isAdmin && !isAgency) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let filter = { _id: req.params.id, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
    if (isAgency) {
      filter.agencyId = req.user.agencyId;
    } else {
      filter.isDirect = true;
    }

    const brand = await User.findOneAndDelete(filter);

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Also delete associated users
    await User.deleteMany({ brandId: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// Update brand details
exports.updateBrand = async (req, res, next) => {
  try {
    const isAdmin = ['supreme_super_admin', 'commander_admin'].includes(req.user.role);
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(req.user.role);

    if (!isAdmin && !isAgency) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let filter = { _id: req.params.id, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
    if (isAgency) {
      filter.agencyId = req.user.agencyId;
    } else {
      filter.isDirect = true;
    }

    const { name, packageName, features, mrr } = req.body;
    let updates = {};
    if (name) updates.companyName = name;
    if (packageName !== undefined) updates.packageName = packageName;
    if (features !== undefined) updates.features = features;
    if (mrr !== undefined) updates.mrr = mrr;

    const brand = await User.findOneAndUpdate(
      filter,
      updates,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// Update brand profile (for brand admins)
exports.updateBrandProfile = async (req, res, next) => {
  try {
    const isBrandAdmin = ['brand_super_admin'].includes(req.user.role);
    if (!isBrandAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update brand profile' });
    }

    const { companyName, contactEmail, domain, industry, logo } = req.body;
    let updates = {};
    if (companyName) updates.companyName = companyName;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (domain) updates.domain = domain;
    if (industry) updates.industry = industry;
    if (logo) updates.logo = logo;

    // Use req.user._id since the brand_super_admin's user record is the brand record 
    // or their brandId if they are just a user
    const brandId = req.user.brandId || req.user._id;

    const brand = await User.findByIdAndUpdate(
      brandId,
      updates,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};
