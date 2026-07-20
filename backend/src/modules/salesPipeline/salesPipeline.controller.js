const salesPipelineService = require("./salesPipeline.service");
const { sendSuccess, sendError } = require("../tasks/shimResponse");

const createDeal = async (req, res) => {
  try {
    const deal = await salesPipelineService.createDeal(req.body, req.companyId, req.user?.name || req.user?.email);
    return sendSuccess(res, "Deal created successfully", { deal });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getAllDeals = async (req, res) => {
  try {
    const deals = await salesPipelineService.getAllDeals(req.companyId, req.query);
    return sendSuccess(res, "Deals retrieved successfully", { deals });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getDealById = async (req, res) => {
  try {
    const deal = await salesPipelineService.getDealById(req.params.id, req.companyId);
    return sendSuccess(res, "Deal retrieved successfully", { deal });
  } catch (error) {
    return sendError(res, 404, error.message);
  }
};

const updateDeal = async (req, res) => {
  try {
    const deal = await salesPipelineService.updateDeal(
      req.params.id,
      req.body,
      req.companyId,
      req.user?.name || req.user?.email
    );
    return sendSuccess(res, "Deal updated successfully", { deal });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const deleteDeal = async (req, res) => {
  try {
    await salesPipelineService.deleteDeal(req.params.id, req.companyId);
    return sendSuccess(res, "Deal deleted successfully");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addDealNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return sendError(res, 400, "Note content is required");
    }
    const deal = await salesPipelineService.addDealNote(
      req.params.id,
      content,
      req.user?.name || req.user?.email || "Anonymous",
      req.companyId
    );
    return sendSuccess(res, "Note added successfully", { deal });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getPipelineAnalytics = async (req, res) => {
  try {
    const analytics = await salesPipelineService.getPipelineAnalytics(req.companyId);
    return sendSuccess(res, "Pipeline analytics retrieved successfully", { analytics });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const convertDealToClient = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return sendError(res, 400, "Email is required to create a client");
    
    const client = await salesPipelineService.convertDealToClient(
      req.params.id,
      email,
      password,
      req.companyId,
      req.user.role,
      req.user.agencyId,
      req.user._id
    );
    return sendSuccess(res, "Deal converted successfully", { client });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

module.exports = {
  createDeal,
  getAllDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  addDealNote,
  getPipelineAnalytics,
  convertDealToClient
};
