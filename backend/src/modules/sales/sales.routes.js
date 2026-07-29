const express = require("express");
const { body } = require("express-validator");
const salesController = require("./sales.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const rbacMiddleware = require("../../middlewares/rbac.middleware");

const router = express.Router();

router.use(authMiddleware);

const createTargetValidation = [
  body("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Valid month is required"),
  body("year").isInt({ min: 2020 }).withMessage("Valid year is required"),
  body("targetAmount")
    .isFloat({ min: 0 })
    .withMessage("Target amount must be positive"),
  body().custom((value) => {
    if (!value.userId && !value.team) {
      throw new Error("Either userId or team must be provided");
    }
    return true;
  }),
];

router.get(
  "/targets",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  salesController.getTargets,
);
router.post(
  "/targets",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  createTargetValidation,
  salesController.createTarget,
);
router.put(
  "/targets/:id",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  salesController.updateTarget,
);
router.get(
  "/tracking",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  salesController.getSalesTracking,
);
router.get(
  "/reports/monthly",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  salesController.generateMonthlyReport,
);
router.post(
  "/targets/:targetId/recalculate",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  salesController.recalculateMetrics,
);

module.exports = router;
