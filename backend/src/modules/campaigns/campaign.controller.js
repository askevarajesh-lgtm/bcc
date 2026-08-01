const campaignService = require("./campaign.service");
const { sendSuccess, sendError } = require("../../utils/response");

const getAllCampaigns = async (req, res) => {
  try {
    const result = await campaignService.getAllCampaigns(
      req.companyId,
      req.query,
      req.user?.role,
      req.user?._id,
    );
    // If pagination exists, return paginated response, otherwise return legacy format
    if (result.pagination) {
      return sendSuccess(res, "Campaigns retrieved successfully", result);
    }
    // Legacy format for backward compatibility
    return sendSuccess(res, "Campaigns retrieved successfully", {
      campaigns: result.data || result,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getCampaignsDropdown = async (req, res) => {
  try {
    const campaigns = await campaignService.getCampaignsDropdown(
      req.companyId,
      req.query,
      req.user?.role,
      req.user?._id,
    );
    return sendSuccess(res, "Campaigns retrieved successfully", { campaigns });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getCampaignById = async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(
      req.params.id,
      req.companyId,
      req.user?.role,
      req.user?._id,
    );
    return sendSuccess(res, "Campaign retrieved successfully", { campaign });
  } catch (error) {
    return sendError(res, 404, error.message);
  }
};

const createCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.createCampaign(
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Campaign created successfully", { campaign });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addDailyData = async (req, res) => {
  try {
    const campaign = await campaignService.addDailyData(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Daily data added successfully", { campaign });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updatePayment = async (req, res) => {
  try {
    const campaign = await campaignService.updatePayment(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Campaign payment updated successfully", {
      campaign,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const reconcilePayment = async (req, res) => {
  try {
    const campaign = await campaignService.reconcilePayment(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Campaign payment reconciled successfully", {
      campaign,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addRecharge = async (req, res) => {
  try {
    const campaign = await campaignService.addRecharge(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
      req.user.role,
    );
    return sendSuccess(res, "Campaign recharge added successfully", {
      campaign,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateRecharge = async (req, res) => {
  try {
    const campaign = await campaignService.updateRecharge(
      req.params.id,
      req.params.rechargeId,
      req.body,
      req.companyId,
      req.user._id,
      req.user.role,
    );
    return sendSuccess(res, "Campaign recharge updated successfully", {
      campaign,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.updateCampaign(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Campaign updated successfully", { campaign });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const result = await campaignService.deleteCampaign(
      req.params.id,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, result.message);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addGlobalRecharge = async (req, res) => {
  try {
    const recharge = await campaignService.addGlobalRecharge(
      req.body,
      req.companyId,
      req.user._id,
      req.user.role,
    );
    return sendSuccess(res, "Campaign recharge added successfully", {
      recharge,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateGlobalRecharge = async (req, res) => {
  try {
    const recharge = await campaignService.updateGlobalRecharge(
      req.params.id,
      req.body,
      req.companyId,
      req.user._id,
      req.user.role,
    );
    return sendSuccess(res, "Campaign recharge updated successfully", {
      recharge,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getAllRecharges = async (req, res) => {
  try {
    const result = await campaignService.getAllRecharges(
      req.companyId,
      req.query,
      req.user?.role,
      req.user?._id,
    );
    return sendSuccess(res, "Recharges retrieved successfully", result);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteGlobalRecharge = async (req, res) => {
  try {
    const result = await campaignService.deleteGlobalRecharge(
      req.params.id,
      req.companyId,
    );
    return sendSuccess(res, result.message);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getClientCampaignSummary = async (req, res) => {
  try {
    const result = await campaignService.getClientCampaignSummary(
      req.params.clientId,
      req.companyId,
    );
    return sendSuccess(res, "Client campaign summary retrieved", result);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getAllCampaigns,
  getCampaignsDropdown,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addDailyData,
  updatePayment,
  reconcilePayment,
  addRecharge,
  updateRecharge,
  addGlobalRecharge,
  updateGlobalRecharge,
  deleteGlobalRecharge,
  getAllRecharges,
  getClientCampaignSummary,
};
