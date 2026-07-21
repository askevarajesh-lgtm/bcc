const AgencyPackage = require('./agencyPackage.model');

exports.getPackages = async (req, res) => {
  try {
    const packages = await AgencyPackage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getPackage = async (req, res) => {
  try {
    const pkg = await AgencyPackage.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const pkg = await AgencyPackage.create(req.body);
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create package', error: error.message });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const pkg = await AgencyPackage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update package', error: error.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const User = require('../auth/user.model');
    const isAssigned = await User.exists({ plan: req.params.id });
    
    if (isAssigned) {
      return res.status(400).json({ 
        success: false, 
        message: 'This package cannot be deleted because it is currently assigned to one or more Agencies or Clients. Please remove or reassign those associations before deleting the package.' 
      });
    }

    const pkg = await AgencyPackage.findByIdAndDelete(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
