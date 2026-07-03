const businessIntelService = require('./businessIntel.service');

exports.getDashboardData = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;

    const data = await businessIntelService.getDashboardData(tenantCompanyId);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching business intelligence data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch business intelligence data', error: error.message });
  }
};
