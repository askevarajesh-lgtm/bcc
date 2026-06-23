const Agency = require('./agency.model');
const User = require('../auth/user.model');

exports.getAgencies = async (req, res, next) => {
  try {
    const agencies = await Agency.find().populate('plan').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: agencies.length, data: agencies });
  } catch (error) {
    next(error);
  }
};

exports.getAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, data: agency });
  } catch (error) {
    next(error);
  }
};

exports.createAgency = async (req, res, next) => {
  try {
    const { name, email, password, package: packageId } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create the Agency
    const agency = await Agency.create({
      name,
      email,
      plan: packageId || null
    });

    // Create the User
    if (password) {
      await User.create({
        email,
        password,
        role: 'agency_super_admin',
        agencyId: agency._id
      });
    }

    res.status(201).json({ success: true, data: agency });
  } catch (error) {
    next(error);
  }
};

exports.updateAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, data: agency });
  } catch (error) {
    next(error);
  }
};

exports.deleteAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findByIdAndDelete(req.params.id);
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
