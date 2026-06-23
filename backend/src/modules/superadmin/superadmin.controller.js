const Agency = require('../accounts/agency.model');
const User = require('../auth/user.model');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalCompanies = await Agency.countDocuments();
    // Assuming active users are those who logged in recently or just total users for now
    const activeUsers = await User.countDocuments();
    
    // Calculate MRR from agencies
    const agencies = await Agency.find({}, 'mrr status');
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
