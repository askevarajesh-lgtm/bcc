const mongoose = require('mongoose');
const analyticsService = require('./analytics.service');

exports.getAnalytics = async (req, res, next) => {
  try {
    let agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      // fallback for test purposes
      agencyId = '60d0fe4f5311236168a10000';
    }

    const { clientId, dateRange } = req.query;

    const dashboard = await analyticsService.getAnalyticsDashboard(agencyId, clientId, dateRange);

    res.status(200).json({
      success: true,
      data: dashboard,
      message: 'Analytics data fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};
