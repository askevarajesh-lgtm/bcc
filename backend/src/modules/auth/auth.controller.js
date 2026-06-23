const User = require('./user.model');
const Agency = require('../accounts/agency.model');
const jwt = require('jsonwebtoken');

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
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
        agencyId: user.agencyId,
        brandId: user.brandId,
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
      { expiresIn: '7d' }
    );

    // If user is an agency manager or super admin, get their package features
    let features = [];
    if (user.agencyId && (user.role === 'agency_manager' || user.role === 'agency_super_admin')) {
      const agency = await Agency.findById(user.agencyId).populate('plan');
      if (agency && agency.plan && agency.plan.features) {
        features = agency.plan.features;
      }
    }

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        agencyId: user.agencyId,
        brandId: user.brandId,
        workspaceId: user.workspaceId,
        features: features
      }
    });
  } catch (error) {
    next(error);
  }
};
