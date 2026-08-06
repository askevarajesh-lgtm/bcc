const User = require('../auth/user.model');
const SlaRecord = require('../sla/sla.model');
const Task = require('../tasks/task.model');
const bcrypt = require('bcryptjs');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalCompanies = await User.countDocuments({ role: { $in: ['commander_admin'] } });
    // Assuming active users are those who logged in recently or just total users for now
    const activeUsers = await User.countDocuments();
    
    // Calculate MRR from agencies
    const agencies = await User.find({ role: { $in: ['commander_admin'] } }, 'mrr status');
    let mrr = 0;
    let churnedCount = 0;
    
    agencies.forEach(agency => {
      if (agency.status === 'active') {
        mrr += (agency.mrr || 0);
      } else if (agency.status === 'churned') {
        churnedCount++;
      }
    });
    
    const churnRate = totalCompanies > 0 ? ((churnedCount / totalCompanies) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalCompanies,
        activeUsers,
        mrr,
        churnRate: `${churnRate}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { companyName, email, phone, domain, logo, logoDark } = req.body;
    
    // Check if email is being updated to an existing one
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email is already in use.' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { companyName, email, phone, domain, logo, logoDark },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getPlatformConfig = async (req, res, next) => {
  try {
    const superAdmin = await User.findOne({ role: 'supreme_super_admin' }).select('logo logoDark domain companyName');
    res.status(200).json({
      success: true,
      data: {
        logo: superAdmin?.logo || null,
        logoDark: superAdmin?.logoDark || null,
        domain: superAdmin?.domain || null,
        companyName: superAdmin?.companyName || null,
      }
    });
  } catch (error) {
    next(error);
  }
};

