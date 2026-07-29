const { validationResult } = require("express-validator");
const domainPurchaseService = require("./domainPurchase.service");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../../utils/response");

const getAllDomainPurchases = async (req, res) => {
  try {
    const result = await domainPurchaseService.getAllDomainPurchases(
      req.companyId,
      req.query,
    );
    return sendSuccess(res, "Domain purchases retrieved successfully", result);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getDomainPurchaseById = async (req, res) => {
  try {
    const domainPurchase = await domainPurchaseService.getDomainPurchaseById(
      req.params.id,
      req.companyId,
    );
    return sendSuccess(res, "Domain purchase retrieved successfully", {
      domainPurchase,
    });
  } catch (error) {
    return sendError(res, 404, error.message);
  }
};

const createDomainPurchase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    // Get payment screenshot URL from Cloudinary if file was uploaded
    let paymentScreenshotUrl = req.body.paymentScreenshotUrl || null;
    if (req.file && req.file.path) {
      paymentScreenshotUrl = req.file.path;
    }

    const domainPurchase = await domainPurchaseService.createDomainPurchase(
      { ...req.body, paymentScreenshotUrl },
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Domain purchase created successfully", {
      domainPurchase,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateDomainPurchase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    // Get payment screenshot URL from Cloudinary if file was uploaded
    let paymentScreenshotUrl = req.body.paymentScreenshotUrl || null;
    if (req.file && req.file.path) {
      paymentScreenshotUrl = req.file.path;
    }

    const domainPurchase = await domainPurchaseService.updateDomainPurchase(
      req.params.id,
      { ...req.body, paymentScreenshotUrl },
      req.companyId,
      req.user._id,
    );
    return sendSuccess(res, "Domain purchase updated successfully", {
      domainPurchase,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const deleteDomainPurchase = async (req, res) => {
  try {
    const result = await domainPurchaseService.deleteDomainPurchase(
      req.params.id,
      req.companyId,
    );
    return sendSuccess(res, result.message);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

module.exports = {
  getAllDomainPurchases,
  getDomainPurchaseById,
  createDomainPurchase,
  updateDomainPurchase,
  deleteDomainPurchase,
};
