const express = require("express");
const { body } = require("express-validator");
const domainPurchaseController = require("./domainPurchase.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const rbacMiddleware = require("../../middlewares/rbac.middleware");
const upload = require("../../middlewares/upload");

const router = express.Router();

router.use(authMiddleware);

// Domain Purchase routes
const createDomainPurchaseValidation = [
  body("domainName").notEmpty().withMessage("Domain Name is required"),
  body("companyId").notEmpty().withMessage("Company Name is required"),
  body("paidAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Paid Amount must be a positive number"),
  body("balance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Balance must be a positive number"),
  body("gst")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("GST must be a positive number"),
];

// Allow access for admin, coordinators, and users with transaction permissions
router.get(
  "/domain-purchases",
  rbacMiddleware.requireRole([
    "supreme_super_admin",
    "commander_admin",
    "agency_super_admin",
    "agency_manager"
  ]),
  domainPurchaseController.getAllDomainPurchases,
);
router.get(
  "/domain-purchases/:id",
  rbacMiddleware.requireRole([
    "supreme_super_admin",
    "commander_admin",
    "agency_super_admin",
    "agency_manager"
  ]),
  domainPurchaseController.getDomainPurchaseById,
);
router.post(
  "/domain-purchases",
  rbacMiddleware.requireRole([
    "supreme_super_admin",
    "commander_admin",
    "agency_super_admin",
    "agency_manager"
  ]),
  upload.single("paymentScreenshotFile"),
  createDomainPurchaseValidation,
  domainPurchaseController.createDomainPurchase,
);
router.put(
  "/domain-purchases/:id",
  rbacMiddleware.requireRole([
    "supreme_super_admin",
    "commander_admin",
    "agency_super_admin",
    "agency_manager"
  ]),
  upload.single("paymentScreenshotFile"),
  createDomainPurchaseValidation,
  domainPurchaseController.updateDomainPurchase,
);
router.delete(
  "/domain-purchases/:id",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  domainPurchaseController.deleteDomainPurchase,
);

module.exports = router;
