const funnelService = require('./funnel.service');
const analyticsService = require('./funnel.analytics.service');

exports.createFunnel = async (req, res, next) => {
  try {
    const funnel = await funnelService.createFunnel(req.workspaceId, req.body, req.user?._id);
    res.status(201).json({ success: true, data: funnel });
  } catch (error) {
    next(error);
  }
};

exports.getFunnels = async (req, res, next) => {
  try {
    const result = await funnelService.getFunnels(req.workspaceId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.getFunnelDetails = async (req, res, next) => {
  try {
    const funnel = await funnelService.getFunnelById(req.params.id, req.workspaceId);
    const steps = await funnelService.getSteps(req.params.id, req.workspaceId);
    res.json({ success: true, data: { ...funnel.toObject(), steps } });
  } catch (error) {
    next(error);
  }
};

exports.updateFunnel = async (req, res, next) => {
  try {
    const funnel = await funnelService.updateFunnel(req.params.id, req.workspaceId, req.body, req.user?._id);
    res.json({ success: true, data: funnel });
  } catch (error) {
    next(error);
  }
};

exports.deleteFunnel = async (req, res, next) => {
  try {
    await funnelService.deleteFunnel(req.params.id, req.workspaceId, req.user?._id);
    res.json({ success: true, message: 'Funnel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.publishFunnel = async (req, res, next) => {
  try {
    const funnel = await funnelService.publishFunnel(req.params.id, req.workspaceId, req.user?._id);
    res.json({ success: true, data: funnel });
  } catch (error) {
    next(error);
  }
};

exports.unpublishFunnel = async (req, res, next) => {
  try {
    const funnel = await funnelService.unpublishFunnel(req.params.id, req.workspaceId, req.user?._id);
    res.json({ success: true, data: funnel });
  } catch (error) {
    next(error);
  }
};

exports.addStep = async (req, res, next) => {
  try {
    const step = await funnelService.addStep(req.params.id, req.workspaceId, req.body);
    res.status(201).json({ success: true, data: step });
  } catch (error) {
    next(error);
  }
};

exports.getSteps = async (req, res, next) => {
  try {
    const steps = await funnelService.getSteps(req.params.id, req.workspaceId);
    res.json({ success: true, data: steps });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    await funnelService.getFunnelById(req.params.id, req.workspaceId);
    const analytics = await analyticsService.getAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
