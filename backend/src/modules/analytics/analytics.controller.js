const mongoose = require('mongoose');
const { buildAnalyticsDashboard } = require('./services/metrics.service');
const { toAnalyticsResponseDto } = require('./dto/analyticsResponse.dto');
const analyticsCache = require('./services/analyticsCache.service');
const { resolveDateRange } = require('./utils/dateRange');
const AnalyticsProject = require('./models/analyticsProject.model');

exports.getAnalytics = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));

    if (!agencyId || !mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ success: false, message: 'Agency ID missing or invalid on user token' });
    }

    const { projectId, dateRange, bypassCache } = req.query;
    const range = resolveDateRange(dateRange);

    if (bypassCache === 'true') {
      await analyticsCache.invalidate({ agencyId, projectId, start: range.ga4Start, end: range.ga4End });
      // Also invalidate 'undefined' or 'all' project cache when refreshing a specific project
      if (projectId) {
         await analyticsCache.invalidate({ agencyId, projectId: undefined, start: range.ga4Start, end: range.ga4End });
      }
    }

    const dashboard = await analyticsCache.getOrCompute(
      { agencyId, projectId, start: range.ga4Start, end: range.ga4End },
      () => buildAnalyticsDashboard({ agencyId, projectId, rawDateRange: dateRange })
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

exports.getProjects = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const clientId = req.user.role === 'CLIENT' ? req.user._id : null;

    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing' });
    }

    const filter = { companyId: agencyId, isDeleted: false };
    if (clientId) filter.clientId = clientId;

    const projects = await AnalyticsProject.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing' });
    }

    const { domain, name, ga4PropertyId } = req.body;
    
    // In many SaaS models, the agency creates projects for clients, or for themselves.
    // For simplicity, default clientId to agencyId unless provided differently by frontend in future
    const clientId = agencyId; 

    const existing = await AnalyticsProject.findOne({ domain, companyId: agencyId, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Project with this domain already exists' });
    }

    const project = new AnalyticsProject({
      companyId: agencyId,
      clientId,
      createdBy: req.user._id,
      domain,
      name,
      credentials: {
        ga4PropertyId: ga4PropertyId || ''
      }
    });

    await project.save();

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.updateGa4Property = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ga4PropertyId } = req.body;

    const project = await AnalyticsProject.findById(id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.credentials = project.credentials || {};
    project.credentials.ga4PropertyId = ga4PropertyId;
    await project.save();

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};