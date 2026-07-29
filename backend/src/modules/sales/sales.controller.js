const { validationResult } = require("express-validator");
const salesService = require("./sales.service");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../../utils/response");

const getTargets = async (req, res) => {
  try {
    const targets = await salesService.getTargets(req.companyId, req.query);
    return sendSuccess(res, "Targets retrieved successfully", { targets });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createTarget = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const target = await salesService.createTarget(req.body, req.companyId);
    return sendSuccess(res, "Target created successfully", { target });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateTarget = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const target = await salesService.updateTarget(
      req.params.id,
      req.body,
      req.companyId,
    );
    return sendSuccess(res, "Target updated successfully", { target });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getSalesTracking = async (req, res) => {
  try {
    const tracking = await salesService.getSalesTracking(
      req.companyId,
      req.query,
    );
    return sendSuccess(res, "Sales tracking retrieved successfully", {
      tracking,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year, format } = req.query;
    if (!month || !year) {
      return sendError(res, 400, "Month and year are required");
    }

    const report = await salesService.generateMonthlyReport(
      req.companyId,
      parseInt(month),
      parseInt(year),
    );

    // If format is PDF, generate and return PDF
    if (format === "pdf") {
      const PDFService = require("../../utils/pdf.service");
      const User = require("../auth/user.model");
      const tenantCompany = await User.findById(req.companyId).select(
        "name email phone address logo",
      );

      const pdfBuffer = await PDFService.generateSalesReportPDF(
        report,
        tenantCompany,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sales-report-${year}-${month.toString().padStart(2, "0")}.pdf`,
      );
      return res.send(pdfBuffer);
    }

    return sendSuccess(res, "Monthly report generated successfully", {
      report,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const recalculateMetrics = async (req, res) => {
  try {
    const { targetId } = req.params;
    await salesService.recalculateTargetMetrics(targetId, req.companyId);
    return sendSuccess(res, "Metrics recalculated successfully");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getTargets,
  createTarget,
  updateTarget,
  getSalesTracking,
  generateMonthlyReport,
  recalculateMetrics,
};
