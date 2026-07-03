const express = require("express");
const integrationController = require("./integration.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireRole } = require("../../middlewares/rbac.middleware");
const rbacMiddleware = (...roles) => requireRole(roles);

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  rbacMiddleware(
    "super_admin",
    "admin",
    "coordinator",
    "digital_marketing_coordinator",
    "website_coordinator",
  ),
  integrationController.getAllIntegrations,
);
router.post(
  "/",
  rbacMiddleware("super_admin", "admin"),
  integrationController.createIntegration,
);
router.put(
  "/:id",
  rbacMiddleware("super_admin", "admin"),
  integrationController.updateIntegration,
);
router.post(
  "/:id/send",
  rbacMiddleware("admin", "salesperson"),
  integrationController.sendMessage,
);
router.get(
  "/:id/whatsapp/templates",
  rbacMiddleware("super_admin", "admin"),
  integrationController.fetchWhatsAppTemplates,
);
router.post(
  "/:id/whatsapp-leads/fetch",
  rbacMiddleware("super_admin", "admin"),
  integrationController.fetchWhatsAppLeads,
);

// Ekta HR integration endpoints removed

module.exports = router;
