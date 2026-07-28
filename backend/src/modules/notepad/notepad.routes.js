const express = require("express");
const router = express.Router();
const notepadController = require("./notepad.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const tenantMiddleware = (req, res, next) => next();
const { requireRole } = require("../../middlewares/rbac.middleware");

// All routes require authentication and tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// User routes - accessible to all authenticated users
router.get("/today", notepadController.getTodayNote);
router.post("/today", notepadController.createOrUpdateTodayNote);
router.put("/today", notepadController.createOrUpdateTodayNote);
router.get("/history", notepadController.getNotesHistory);

const adminRoles = [
  "supreme_super_admin",
  "commander_admin",
  "agency_super_admin",
  "agency_manager",
  "brand_super_admin",
  "brand_manager",
  "agency",
  "client",
  "agency_client"
];

// Admin routes - only accessible to admin
router.get(
  "/admin/latest-reports",
  requireRole(adminRoles),
  notepadController.getAllUsersLatestReports,
);
router.get(
  "/admin/report-history",
  requireRole(adminRoles),
  notepadController.getAllUsersReportHistory,
);
router.post(
  "/admin/notify-missing-reports",
  requireRole(adminRoles),
  notepadController.notifyMissingYesterdayReports,
);

module.exports = router;
