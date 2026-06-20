const User = require('../models/User');
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

    // Sign JWT token containing user role and workspace id mapping
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role, 
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId
      }
    });
  } catch (error) {
    next(error);
  }
};
