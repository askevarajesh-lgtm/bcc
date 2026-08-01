const express = require("express");
const router = express.Router();
const campaignController = require("./campaign.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const rbacMiddleware = require("../../middlewares/rbac.middleware");
const permissionMiddleware = (...args) => (req, res, next) => next();
const autoPermissionMiddleware = (req, res, next) => next();

router.use(authMiddleware);

// Get all campaigns
router.get("/", autoPermissionMiddleware, campaignController.getAllCampaigns);

// Get all recharges
router.get(
  "/recharges",
  autoPermissionMiddleware,
  campaignController.getAllRecharges,
);
router.get(
  "/dropdown",
  autoPermissionMiddleware,
  campaignController.getCampaignsDropdown,
);

// Get client campaign summary (Total Value vs Recharges)
router.get(
  "/client-summary/:clientId",
  permissionMiddleware("view-campaign"),
  campaignController.getClientCampaignSummary,
);

// Get campaign by ID
router.get(
  "/:id",
  autoPermissionMiddleware,
  campaignController.getCampaignById,
);

// Create campaign
router.post(
  "/",
  permissionMiddleware("create-campaign"),
  campaignController.createCampaign,
);

// Add global recharge
router.post(
  "/recharges",
  permissionMiddleware("create-campaign"),
  campaignController.addGlobalRecharge,
);

// Update global recharge
router.put(
  "/recharges/:id",
  permissionMiddleware("edit-campaign"),
  campaignController.updateGlobalRecharge,
);

// Delete global recharge
router.delete(
  "/recharges/:id",
  permissionMiddleware("delete-campaign"),
  campaignController.deleteGlobalRecharge,
);

// Add daily campaign data
router.post(
  "/:id/daily-data",
  permissionMiddleware("edit-campaign"),
  campaignController.addDailyData,
);

// Update campaign payment
router.put(
  "/:id/payment",
  permissionMiddleware("edit-campaign"),
  campaignController.updatePayment,
);

// Reconcile campaign payment
router.post(
  "/:id/reconcile-payment",
  permissionMiddleware("edit-campaign"),
  campaignController.reconcilePayment,
);

// Add campaign recharge
router.post(
  "/:id/recharge",
  permissionMiddleware("edit-campaign"),
  campaignController.addRecharge,
);

// Update campaign recharge
router.put(
  "/:id/recharge/:rechargeId",
  permissionMiddleware("edit-campaign"),
  campaignController.updateRecharge,
);

// Update campaign (Admin, Coordinator, Digital Marketing Coordinator, Website Coordinator)
router.put(
  "/:id",
  permissionMiddleware("edit-campaign"),
  campaignController.updateCampaign,
);

// Delete campaign (Admin, Coordinator, Digital Marketing Coordinator, Website Coordinator)
router.delete(
  "/:id",
  permissionMiddleware("delete-campaign"),
  campaignController.deleteCampaign,
);

module.exports = router;
