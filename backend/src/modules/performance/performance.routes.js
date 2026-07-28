const express = require("express");
const performanceController = require("./performance.controller");
const performanceScorecardController = require("./performanceScorecard.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const tenantMiddleware = require("../../middleware/tenant.middleware");
const {
  permissionMiddleware,
} = require("../../middleware/permission.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

// Existing performance routes
router.get(
  "/",
  permissionMiddleware("view-performance"),
  performanceController.getPerformance,
);
router.post(
  "/calculate",
  permissionMiddleware("view-performance"),
  performanceController.calculatePerformance,
);
router.post(
  "/calculate-all",
  permissionMiddleware("view-performance"),
  performanceController.calculatePerformanceForAll,
);

// Performance scorecard routes
// Self-assessment routes (for all users)
router.post(
  "/scorecard/self-assessment",
  permissionMiddleware("view-performance"),
  performanceScorecardController.submitSelfAssessment,
);
router.get(
  "/scorecard/self-assessment",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getSelfAssessment,
);

// Admin review routes
router.post(
  "/scorecard",
  permissionMiddleware("view-performance"),
  performanceScorecardController.createOrUpdateScorecard,
);
router.get(
  "/scorecard/last-month",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getLastMonthScorecard,
);
router.get(
  "/scorecard/history",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getPerformanceHistory,
);
router.get(
  "/scorecard/all",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getAllScorecards,
);

// Self-assessment notification routes (admin only) - MUST be before /:id route
router.get(
  "/scorecard/pending-users",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getUsersWithoutSelfAssessment,
);
router.post(
  "/scorecard/notify-pending",
  permissionMiddleware("view-performance"),
  performanceScorecardController.notifyPendingSelfAssessment,
);

// This route must be LAST to avoid matching specific routes above
router.get(
  "/scorecard/:id",
  permissionMiddleware("view-performance"),
  performanceScorecardController.getScorecardById,
);

module.exports = router;
