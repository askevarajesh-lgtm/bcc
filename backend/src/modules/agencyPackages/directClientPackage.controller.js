const DirectClientPackage = require('./directClientPackage.model');

// Get all direct client packages
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await DirectClientPackage.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    const User = require('../auth/user.model');
    const data = await Promise.all(packages.map(async (pkg) => {
      const isAssigned = await User.exists({ packageName: pkg.name, isDirect: true, createdBy: pkg.createdBy });
      return { ...pkg, isAssigned: !!isAssigned };
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// Create a direct client package
exports.createPackage = async (req, res, next) => {
  try {
    const { name, description, price, userCount, features } = req.body;
    
    // Check if package with name already exists for this admin
    const existingPkg = await DirectClientPackage.findOne({ name, createdBy: req.user._id });
    if (existingPkg) {
      return res.status(400).json({ success: false, message: 'Package with this name already exists' });
    }

    const pkg = await DirectClientPackage.create({
      name,
      description,
      price,
      userCount,
      features,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

// Update a direct client package
exports.updatePackage = async (req, res, next) => {
  try {
    const User = require('../auth/user.model');
    const existingPkgForName = await DirectClientPackage.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (existingPkgForName) {
      const isAssigned = await User.exists({ packageName: existingPkgForName.name, isDirect: true, createdBy: req.user._id });
      if (isAssigned) {
        return res.status(400).json({ 
          success: false, 
          message: 'This package is already assigned to one or more organizations and cannot be edited.' 
        });
      }
    }

    const pkg = await DirectClientPackage.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

// Delete a direct client package
exports.deletePackage = async (req, res, next) => {
  try {
    const pkg = await DirectClientPackage.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
