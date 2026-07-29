const { validationResult } = require("express-validator");
const expenseService = require("./expense.service");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../../utils/response");

const getAllExpenses = async (req, res) => {
  try {
    const result = await expenseService.getAllExpenses(
      req.companyId,
      req.query,
    );
    // If pagination exists, return paginated response, otherwise return legacy format
    if (result.pagination) {
      return sendSuccess(res, "Expenses retrieved successfully", result);
    }
    // Legacy format for backward compatibility
    return sendSuccess(res, "Expenses retrieved successfully", {
      expenses: result.data || result,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getExpensesDropdown = async (req, res) => {
  try {
    const expenses = await expenseService.getExpensesDropdown(
      req.companyId,
      req.query,
    );
    return sendSuccess(res, "Expenses retrieved successfully", { expenses });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    const expense = await expenseService.createExpense(
      req.body,
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Expense created successfully", { expense });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    const expense = await expenseService.updateExpense(
      req.params.id,
      req.body,
      req.companyId,
    );
    return sendSuccess(res, "Expense updated successfully", { expense });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const deleteExpense = async (req, res) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.companyId);
    return sendSuccess(res, "Expense deleted successfully");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getExpenseStats = async (req, res) => {
  try {
    const stats = await expenseService.getExpenseStats(
      req.companyId,
      req.query,
    );
    return sendSuccess(res, "Expense statistics retrieved successfully", stats);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pl = await expenseService.getProfitLoss(
      req.companyId,
      startDate,
      endDate,
    );
    return sendSuccess(res, "Profit & Loss retrieved successfully", pl);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getMonthlySummary = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const summary = await expenseService.getMonthlySummary(
      req.companyId,
      month,
      year,
    );
    return sendSuccess(
      res,
      "Monthly expense summary retrieved successfully",
      summary,
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const downloadProfitLossPDF = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    // Get P&L data
    const plData = await expenseService.getProfitLoss(
      req.companyId,
      startDate,
      endDate,
    );

    // Get company details
    const User = require("../auth/user.model");
    const tenantCompany = await User.findById(req.companyId).select(
      "name email phone address logo",
    );

    // Generate PDF
    const PDFService = require("../../utils/pdf.service");
    const period = {};
    if (month && year) {
      period.month = parseInt(month);
      period.year = parseInt(year);
    } else if (startDate && endDate) {
      period.startDate = startDate;
      period.endDate = endDate;
    }

    const pdfBuffer = await PDFService.generateProfitLossPDF(
      plData,
      tenantCompany,
      period,
    );

    // Generate filename
    let filename = "profit-loss-report";
    if (month && year) {
      filename = `profit-loss-${year}-${month.toString().padStart(2, "0")}.pdf`;
    } else if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split("T")[0];
      const end = new Date(endDate).toISOString().split("T")[0];
      filename = `profit-loss-${start}-to-${end}.pdf`;
    } else {
      filename = `profit-loss-${new Date().toISOString().split("T")[0]}.pdf`;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const duplicateFixedExpenses = async (req, res) => {
  try {
    const { sourceMonth, sourceYear, targetMonth, targetYear } = req.body;

    if (!sourceMonth || !sourceYear || !targetMonth || !targetYear) {
      return sendError(res, 400, "Source and target month/year are required");
    }

    if (
      sourceMonth < 1 ||
      sourceMonth > 12 ||
      targetMonth < 1 ||
      targetMonth > 12
    ) {
      return sendError(res, 400, "Month must be between 1 and 12");
    }

    const result = await expenseService.duplicateFixedExpensesFromMonth(
      req.companyId,
      parseInt(sourceMonth),
      parseInt(sourceYear),
      parseInt(targetMonth),
      parseInt(targetYear),
      req.user._id,
    );

    if (result.success) {
      return sendSuccess(res, result.message, result);
    } else {
      return sendError(res, 400, result.message);
    }
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const duplicateVariableExpenses = async (req, res) => {
  try {
    const { sourceMonth, sourceYear, targetMonth, targetYear } = req.body;

    if (!sourceMonth || !sourceYear || !targetMonth || !targetYear) {
      return sendError(res, 400, "Source and target month/year are required");
    }

    if (
      sourceMonth < 1 ||
      sourceMonth > 12 ||
      targetMonth < 1 ||
      targetMonth > 12
    ) {
      return sendError(res, 400, "Month must be between 1 and 12");
    }

    const result = await expenseService.duplicateVariableExpensesFromMonth(
      req.companyId,
      parseInt(sourceMonth),
      parseInt(sourceYear),
      parseInt(targetMonth),
      parseInt(targetYear),
      req.user._id,
    );

    if (result.success || result.count > 0) {
      return sendSuccess(res, result.message, result);
    } else {
      return sendError(res, 400, result.message);
    }
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getSalaryHistory = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    if (!staffId) {
      return sendError(res, 400, "Employee ID (staffId) is required");
    }

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const history = await expenseService.getSalaryHistoryByEmployee(
      staffId,
      req.companyId,
      filters,
    );
    return sendSuccess(res, "Salary history retrieved successfully", {
      history,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAllSalaryHistory = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const filters = {};
    if (staffId) filters.staffId = staffId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const history = await expenseService.getAllSalaryHistory(
      req.companyId,
      filters,
    );
    return sendSuccess(res, "Salary history retrieved successfully", {
      history,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getAllExpenses,
  getExpensesDropdown,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlySummary,
  getProfitLoss,
  downloadProfitLossPDF,
  duplicateFixedExpenses,
  duplicateVariableExpenses,
  getSalaryHistory,
  getAllSalaryHistory,
};
