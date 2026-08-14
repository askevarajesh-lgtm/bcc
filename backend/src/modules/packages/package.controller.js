const Package = require('./package.model');
const integrationService = require('../integrations/integration.service');
const { getEffectivePackageIntegrations } = require('./packageAccess.service');

const VALID_TYPES = ['agency', 'client', 'directClient'];

// Validates selected package integrations against the database within the creator's company/platform scope.
const validatePackageIntegrations = async (integrations, req) => {
  if (integrations === undefined) return;
  const normalized = normalizeIntegrations(integrations);
  if (normalized.length === 0) return;

  const role = req.user?.role;
  if (["super_admin", "supreme_super_admin", "commander_admin"].includes(role)) {
    return; // Platform admins can assign any validly formatted integration type
  }

  const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
  const allowedIntegrations = await getEffectivePackageIntegrations(req.user);
  const allowedTypes = new Set(allowedIntegrations);

  for (const type of normalized) {
    if (!allowedTypes.has(type)) {
      throw new Error(`Integration type "${type}" is invalid or not available in your scope.`);
    }
  }
};

// Sanitizes package-level integration entitlements before they hit the DB.
// Accepts only an array of non-empty strings (stable Integration `type` values,
// e.g. 'whatsapp', 'payment' -- never Integration document _id values), dedupes
// them, and safely falls back to [] for anything malformed (non-array, null,
// undefined, wrong element types). This keeps old packages (saved before this
// field existed) and any bad client input from ever producing an invalid state --
// `integrations` is always a clean array, never undefined/null/mixed-type.
const normalizeIntegrations = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean)
  )];
};

// Same helper as the old accounts/clientPackage.controller.js
const getAgencyId = (req) => (req.user.role === 'agency_super_admin' ? req.user._id : req.user.agencyId);

// Builds the scope filter that used to be implicit in which collection/controller you hit.
const buildScope = (type, req) => {
  if (type === 'client') {
    const agencyId = getAgencyId(req);
    if (!agencyId) return { error: 'Agency context not found' };
    return { filter: { agencyId }, agencyId };
  }
  if (type === 'directClient') {
    return { filter: { createdBy: req.user._id }, createdBy: req.user._id };
  }
  // agency packages are global, same as the old AgencyPackage controller
  return { filter: {} };
};

// Mirrors the "isAssigned" check each legacy controller used to run against User
const checkAssignment = async (pkg) => {
  const User = require('../auth/user.model');
  if (pkg.type === 'agency') {
    return User.exists({ plan: pkg._id });
  }
  if (pkg.type === 'client') {
    return User.exists({ packageName: pkg.name, agencyId: pkg.agencyId });
  }
  if (pkg.type === 'directClient') {
    return User.exists({ packageName: pkg.name, isDirect: true, createdBy: pkg.createdBy });
  }
  return false;
};

// GET /packages?type=agency|client|directClient&search=&page=&limit=&sortBy=&sortOrder=
exports.getPackages = async (req, res, next) => {
  const { type, search, page, limit, sortBy, sortOrder } = req.query;

  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: 'A valid type query parameter (agency, client, directClient) is required' });
  }

  try {
    const { filter: scopeFilter, error } = buildScope(type, req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const filter = { type, ...scopeFilter };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 };

    let query = Package.find(filter).sort(sort);

    const hasPagination = Boolean(page && limit);
    let pageNum, limitNum;
    if (hasPagination) {
      pageNum = Math.max(parseInt(page, 10) || 1, 1);
      limitNum = Math.max(parseInt(limit, 10) || 10, 1);
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const packages = await query.lean();
    const data = await Promise.all(packages.map(async (pkg) => {
      const isAssigned = await checkAssignment(pkg);
      return { ...pkg, isAssigned: !!isAssigned };
    }));

    const response = { success: true, count: data.length, data };
    if (hasPagination) {
      response.total = await Package.countDocuments(filter);
      response.page = pageNum;
      response.limit = limitNum;
    }

    res.status(200).json(response);
  } catch (error) {
    // agency-type reads used to fail with an explicit 500 + 'Server Error' message;
    // client/directClient used next(error). Type is validated up front here, so
    // route unexpected errors the same way each legacy path used to.
    if (type === 'agency') {
      return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
    next(error);
  }
};

// GET /packages/:id
exports.getPackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const { filter: scopeFilter, error } = buildScope(pkg.type, req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    if (scopeFilter.agencyId && String(pkg.agencyId) !== String(scopeFilter.agencyId)) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    if (scopeFilter.createdBy && String(pkg.createdBy) !== String(scopeFilter.createdBy)) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// POST /packages  (body must include type)
exports.createPackage = async (req, res, next) => {
  const { type } = req.body;
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: 'A valid type field (agency, client, directClient) is required' });
  }

  if (type === 'client') {
    try {
      const agencyId = getAgencyId(req);
      if (!agencyId) return res.status(400).json({ success: false, message: 'Agency context not found' });

      await validatePackageIntegrations(req.body.integrations, req);

      const newPackage = new Package({ 
        ...req.body, 
        type: 'client', 
        agencyId,
        integrations: normalizeIntegrations(req.body.integrations)
      });
      await newPackage.save();
      return res.status(201).json({ success: true, message: 'Package created successfully', data: newPackage });
    } catch (error) {
      return next(error);
    }
  }

  if (type === 'directClient') {
    try {
      // Same fields as the legacy directClientPackage.controller.js createPackage
      // (billingInterval was never accepted on create there either -- schema default applies)
      const { name, description, price, userCount, features, integrations } = req.body;

      const existingPkg = await Package.findOne({ type: 'directClient', name, createdBy: req.user._id });
      if (existingPkg) {
        return res.status(400).json({ success: false, message: 'Package with this name already exists' });
      }

      await validatePackageIntegrations(integrations, req);

      const pkg = await Package.create({
        type: 'directClient',
        name,
        description,
        price,
        userCount,
        features,
        // Stable Integration `type` identifiers this Direct Brand Package entitles
        // its holder to -- always normalized to a clean array, never trusted raw.
        integrations: normalizeIntegrations(integrations),
        createdBy: req.user._id
      });

      return res.status(201).json({ success: true, data: pkg });
    } catch (error) {
      return next(error);
    }
  }

  // type === 'agency'
  try {
    await validatePackageIntegrations(req.body.integrations, req);

    const pkg = await Package.create({
      ...req.body,
      type: 'agency',
      // Stable Integration `type` identifiers this Agency Package entitles its
      // holder to -- always normalized to a clean array, never trusted raw.
      integrations: normalizeIntegrations(req.body.integrations)
    });
    return res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Failed to create package', error: error.message });
  }
};

// PUT /packages/:id
exports.updatePackage = async (req, res, next) => {
  const User = require('../auth/user.model');

  let existing;
  try {
    existing = await Package.findById(req.params.id);
  } catch (error) {
    return next(error);
  }
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Package not found' });
  }

  if (existing.type === 'agency') {
    try {
      const isAssigned = await User.exists({ plan: req.params.id });
      if (isAssigned) {
        return res.status(400).json({
          success: false,
          message: 'This package is already assigned to one or more organizations and cannot be edited.'
        });
      }

      // Only sanitize integrations if the caller actually sent the field --
      // leaving it untouched otherwise preserves the existing partial-update
      // behavior (a PUT that omits `integrations` must not wipe it to []).
      if (req.body.integrations !== undefined) {
        req.body.integrations = normalizeIntegrations(req.body.integrations);
        await validatePackageIntegrations(req.body.integrations, req);
      }

      const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'Package not found' });
      }
      return res.status(200).json({ success: true, data: pkg });
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Failed to update package', error: error.message });
    }
  }

  if (existing.type === 'client') {
    try {
      const agencyId = getAgencyId(req);

      if (req.body.integrations !== undefined) {
        req.body.integrations = normalizeIntegrations(req.body.integrations);
        await validatePackageIntegrations(req.body.integrations, req);
      }

      const existingPkgForName = await Package.findOne({ _id: req.params.id, type: 'client', agencyId });
      if (existingPkgForName) {
        const isAssigned = await User.exists({ packageName: existingPkgForName.name, agencyId });
        if (isAssigned) {
          return res.status(400).json({
            success: false,
            message: 'This package is already assigned to one or more organizations and cannot be edited.'
          });
        }
      }

      const updatedPackage = await Package.findOneAndUpdate(
        { _id: req.params.id, type: 'client', agencyId },
        req.body,
        { returnDocument: 'after', runValidators: true }
      );

      if (!updatedPackage) return res.status(404).json({ success: false, message: 'Package not found' });
      return res.status(200).json({ success: true, message: 'Package updated successfully', data: updatedPackage });
    } catch (error) {
      return next(error);
    }
  }

  // directClient
  try {
    const existingPkgForName = await Package.findOne({ _id: req.params.id, type: 'directClient', createdBy: req.user._id });
    if (existingPkgForName) {
      const isAssigned = await User.exists({ packageName: existingPkgForName.name, isDirect: true, createdBy: req.user._id });
      if (isAssigned) {
        return res.status(400).json({
          success: false,
          message: 'This package is already assigned to one or more organizations and cannot be edited.'
        });
      }
    }

    // Only sanitize integrations if the caller actually sent the field --
    // leaving it untouched otherwise preserves existing partial-update behavior.
    if (req.body.integrations !== undefined) {
      req.body.integrations = normalizeIntegrations(req.body.integrations);
      await validatePackageIntegrations(req.body.integrations, req);
    }

    const pkg = await Package.findOneAndUpdate(
      { _id: req.params.id, type: 'directClient', createdBy: req.user._id },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    return next(error);
  }
};

// DELETE /packages/:id
exports.deletePackage = async (req, res, next) => {
  const User = require('../auth/user.model');

  let existing;
  try {
    existing = await Package.findById(req.params.id);
  } catch (error) {
    return next(error);
  }
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Package not found' });
  }

  if (existing.type === 'agency') {
    try {
      const isAssigned = await User.exists({ plan: req.params.id });
      if (isAssigned) {
        return res.status(400).json({
          success: false,
          message: 'This package cannot be deleted because it is currently assigned to one or more Agencies or Clients. Please remove or reassign those associations before deleting the package.'
        });
      }

      const pkg = await Package.findByIdAndDelete(req.params.id);
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'Package not found' });
      }
      return res.status(200).json({ success: true, data: {} });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }

  if (existing.type === 'client') {
    try {
      const agencyId = getAgencyId(req);
      const deletedPackage = await Package.findOneAndDelete({ _id: req.params.id, type: 'client', agencyId });
      if (!deletedPackage) return res.status(404).json({ success: false, message: 'Package not found' });
      return res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }

  // directClient
  try {
    const pkg = await Package.findOneAndDelete({ _id: req.params.id, type: 'directClient', createdBy: req.user._id });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
};