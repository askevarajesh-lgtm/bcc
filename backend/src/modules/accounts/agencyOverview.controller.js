const agencyDashboardService = require('./agencyDashboard.service');

exports.getOverviewData = async (req, res, next) => {
  try {
    const agencyId = req.user.role === 'agency_super_admin' ? req.user._id : req.user.agencyId;
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency context not found' });
    }

    const { month, year, clientId } = req.query;

    let data = {};
    if (req.user.role === 'agency_super_admin') {
      data = await agencyDashboardService.getAgencyExecutiveDashboard(agencyId, month, year, clientId);
    } else {
      data = await agencyDashboardService.getAgencyOperationsDashboard(agencyId, month, year, clientId);
    }

    res.status(200).json({
      success: true,
      data: {
        ...data,
        filters: {
          month: month ? parseInt(month) : new Date().getMonth(),
          year: year ? parseInt(year) : new Date().getFullYear(),
          clientId: clientId || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agency overview:', error);
    next(error);
  }
};
