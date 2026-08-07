const performanceAdsService = require('./performanceAds.service');


exports.getDashboard = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }
    
    let { clientId } = req.query;
    
    // Check if the user is a super admin
    const isSuperAdmin = ['commander_admin', 'supreme_super_admin'].includes(req.user.role);
    
    // If clientId is not provided or it's not a super admin requesting a specific client, use the user's default agency
    let targetAgencyId = agencyId;
    if (clientId && isSuperAdmin) {
      targetAgencyId = clientId;
    } else if (clientId && ['brand_super_admin', 'brand_manager', 'agency_client'].includes(req.user.role)) {
       // A brand can only query their own data
       targetAgencyId = req.user._id;
    }

    const dashboard = await performanceAdsService.getPerformanceAdsDashboard(targetAgencyId);
    
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
    
    let { clientId } = req.body;
    const isSuperAdmin = ['commander_admin', 'supreme_super_admin'].includes(req.user.role);
    let targetAgencyId = agencyId;
    
    if (clientId && isSuperAdmin) {
      targetAgencyId = clientId;
    } else if (clientId && ['brand_super_admin', 'brand_manager', 'agency_client'].includes(req.user.role)) {
       targetAgencyId = req.user._id;
    }

    const dashboard = await performanceAdsService.syncPerformanceAds(targetAgencyId);
    
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
