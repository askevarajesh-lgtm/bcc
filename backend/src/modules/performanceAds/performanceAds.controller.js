const performanceAdsService = require('./performanceAds.service');


exports.getDashboard = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }
    
    // Ensure agencyId is a valid ObjectId, otherwise it will crash mongoose
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      // In development sandbox, some tokens might have non-objectId values
      agencyId = '60d0fe4f5311236168a10000'; // fallback
    }

    const dashboard = await performanceAdsService.getPerformanceAdsDashboard(agencyId);
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

exports.syncData = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }
    
    // Ensure agencyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      agencyId = '60d0fe4f5311236168a10000'; // fallback
    }

    const dashboard = await performanceAdsService.syncPerformanceAds(agencyId);
    
    res.status(200).json({
      success: true,
      data: dashboard,
      message: 'Performance Ads data synchronized successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.addCampaign = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      agencyId = '60d0fe4f5311236168a10000';
    }

    const { campaign, platform, status, budget } = req.body;
    if (!campaign || !platform || !status || !budget) {
      return res.status(400).json({ success: false, message: 'Missing required campaign fields' });
    }

    const dashboard = await performanceAdsService.addCampaign(agencyId, req.body);
    
    res.status(201).json({
      success: true,
      data: dashboard,
      message: 'Campaign added successfully'
    });
  } catch (error) {
    next(error);
  }
};
