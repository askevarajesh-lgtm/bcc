const resourcesService = require('./resources.service');
const { sendSuccess, sendError } = require('../tasks/shimResponse'); // reuse standard response format if shimResponse exists, else fallback to simple json

exports.getDashboardData = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const userRole = req.user.role;
    const userId = req.user._id;
    const filterMonth = req.query.month;

    const data = await resourcesService.getDashboardData(tenantCompanyId, userRole, userId, filterMonth);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching resource dashboard data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resource dashboard data', error: error.message });
  }
};
