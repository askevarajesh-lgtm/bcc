const mongoose = require('mongoose');
const { buildAnalyticsDashboard } = require('./services/metrics.service');
const { toAnalyticsResponseDto } = require('./dto/analyticsResponse.dto');
const analyticsCache = require('./services/analyticsCache.service');
const { resolveDateRange } = require('./utils/dateRange');

exports.getAnalytics = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));

    if (!agencyId || !mongoose.Types.ObjectId.isValid(agencyId)) {
      // No silent fallback to a shared placeholder tenant — an invalid/missing
      // agency context means we genuinely cannot scope this request safely.
      return res.status(400).json({ success: false, message: 'Agency ID missing or invalid on user token' });
    }

    const { clientId, dateRange } = req.query;
    const range = resolveDateRange(dateRange);

    const dashboard = await analyticsCache.getOrCompute(
      { agencyId, clientId, start: range.ga4Start, end: range.ga4End },
      () => buildAnalyticsDashboard({ agencyId, clientId, rawDateRange: dateRange })
    );

    res.status(200).json({
      success: true,
      data: toAnalyticsResponseDto(dashboard),
      message: 'Analytics data fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};