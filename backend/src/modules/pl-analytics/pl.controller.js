const plService = require("./pl.service");
const { sendSuccess, sendError } = require("../../utils/response");

const getProjectPL = async (req, res) => {
  try {
    const plEntry = await plService.getProjectPL(
      req.params.projectId,
      req.companyId,
    );
    return sendSuccess(res, "Project P&L retrieved successfully", { plEntry });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getPLSummary = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    if (month < 1 || month > 12) {
      return sendError(res, 400, "Invalid month. Must be between 1 and 12");
    }

    const summary = await plService.getPLSummary(req.companyId, month, year);
    return sendSuccess(res, "P&L summary retrieved successfully", { summary });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const calculateProjectPL = async (req, res) => {
  try {
    const plEntry = await plService.calculateProjectPL(
      req.params.projectId,
      req.companyId,
    );
    return sendSuccess(res, "Project P&L calculated successfully", { plEntry });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getProjectPL,
  getPLSummary,
  calculateProjectPL,
};
