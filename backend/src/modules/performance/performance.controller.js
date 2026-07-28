const performanceService = require("./performance.service");
const { sendSuccess, sendError } = require("../../utils/response");

const getPerformance = async (req, res) => {
  try {
    const performance = await performanceService.getPerformance(
      req.companyId,
      req.query,
    );
    return sendSuccess(res, "Performance retrieved successfully", {
      performance,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const calculatePerformance = async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    // Input validation
    if (!userId) {
      return sendError(res, 400, "User ID is required");
    }
    if (!month || month < 1 || month > 12) {
      return sendError(res, 400, "Invalid month. Must be between 1 and 12");
    }
    if (!year || year < 2000 || year > 2100) {
      return sendError(res, 400, "Invalid year");
    }

    const result = await performanceService.calculatePerformance(
      userId,
      month,
      year,
      req.companyId,
    );
    return sendSuccess(res, "Performance calculated successfully", {
      performance: result,
    });
  } catch (error) {
    // Handle specific error types
    if (
      error.message.includes("not found") ||
      error.message.includes("does not belong")
    ) {
      return sendError(res, 404, error.message);
    }
    if (
      error.message.includes("Invalid") ||
      error.message.includes("required")
    ) {
      return sendError(res, 400, error.message);
    }
    return sendError(
      res,
      500,
      error.message || "Failed to calculate performance",
    );
  }
};

const calculatePerformanceForAll = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Input validation
    if (!month || month < 1 || month > 12) {
      return sendError(res, 400, "Invalid month. Must be between 1 and 12");
    }
    if (!year || year < 2000 || year > 2100) {
      return sendError(res, 400, "Invalid year");
    }

    const result = await performanceService.calculatePerformanceForAllUsers(
      req.companyId,
      month,
      year,
    );

    return sendSuccess(res, "Performance calculated for all users", result);
  } catch (error) {
    if (
      error.message.includes("Invalid") ||
      error.message.includes("required")
    ) {
      return sendError(res, 400, error.message);
    }
    return sendError(
      res,
      500,
      error.message || "Failed to calculate performance for all users",
    );
  }
};

module.exports = {
  getPerformance,
  calculatePerformance,
  calculatePerformanceForAll,
};
