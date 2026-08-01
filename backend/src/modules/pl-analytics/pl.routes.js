const express = require("express");
const plController = require("./pl.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Get P&L for a project
router.get(
  "/project/:projectId",
  plController.getProjectPL
);

// Calculate/recalculate P&L for a project
router.post(
  "/project/:projectId/calculate",
  plController.calculateProjectPL
);

// Get P&L summary for a period
router.get(
  "/summary",
  plController.getPLSummary
);

module.exports = router;
