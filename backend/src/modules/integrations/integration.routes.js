const express = require("express");
const integrationController = require("./integration.controller");
const metaController = require('./meta.controller');
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireRole } = require("../../middlewares/rbac.middleware");
const rbacMiddleware = (...roles) => requireRole(roles);

const router = express.Router();

// Meta Integration Routes
router.get('/meta/auth', authMiddleware, metaController.generateAuthUrl);
router.get('/meta/callback', metaController.handleCallback); // No authMiddleware for callback since it comes from Meta
router.get('/meta/ad-accounts', authMiddleware, metaController.getAdAccounts);
router.post('/meta/ad-accounts', authMiddleware, metaController.saveSelectedAdAccounts);

router.use(authMiddleware);

router.get('/payment/:companyId', integrationController.getPaymentIntegration);

router.get(
  "/",
  rbacMiddleware(
    "super_admin",
    "supreme_super_admin",
    "commander_admin",
    "admin",
    "coordinator",
    "digital_marketing_coordinator",
    "website_coordinator",
    "agency_manager",
    "agency_super_admin",
    "brand_manager",
    "brand_super_admin"
  ),
  integrationController.getAllIntegrations,
);
router.post(
  "/",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.createIntegration,
);
router.put(
  "/:id",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.updateIntegration,
);
router.post(
  "/:id/events",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.upsertEventConfig,
);
router.get(
  "/:id/events",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.getEventConfigs,
);
router.post(
  "/:id/send",
  rbacMiddleware("super_admin", "admin", "supreme_super_admin", "commander_admin", "salesperson", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.sendMessage,
);
router.get(
  "/:id/whatsapp/templates",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.fetchWhatsAppTemplates,
);
router.post(
  "/:id/whatsapp-leads/fetch",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.fetchWhatsAppLeads,
);
router.post(
  "/whatsapp-leads/sync",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.syncAllWhatsAppLeads,
);

// Ekta HR integration endpoints
router.post(
  "/ekta/validate",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.validateEktaApi,
);
router.post(
  "/:id/ekta/sync/staff",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.syncEktaStaff,
);
router.post(
  "/:id/ekta/sync/attendance",
  rbacMiddleware("super_admin", "supreme_super_admin", "commander_admin", "admin", "agency_manager", "agency_super_admin", "brand_manager", "brand_super_admin"),
  integrationController.syncEktaAttendance,
);

module.exports = router;
