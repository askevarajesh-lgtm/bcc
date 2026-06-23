const express = require('express');
const router = express.Router();
const healthRoutes = require('../modules/health/health.routes');
const websiteRoutes = require('../modules/websites/website.routes');
const funnelRoutes = require('../modules/funnels/funnel.routes');
const storeRoutes = require('../modules/stores/store.routes');
const formRoutes = require('../modules/forms/form.routes');
const blogRoutes = require('../modules/blogs/blog.routes');
const qrRoutes = require('../modules/qrs/qr.routes');
const widgetRoutes = require('../modules/widgets/widget.routes');
const domainRoutes = require('../modules/domains/domain.routes');
const authRoutes = require('../modules/auth/auth.routes');
const templateRoutes = require('../modules/templates/template.routes');
const agencyRoutes = require('../modules/accounts/agency.routes');
const subscriptionRoutes = require('../modules/subscriptions/subscription.routes');
const integrationRoutes = require('../modules/integrations/integration.routes');
const userRoutes = require('../modules/auth/user.routes');
const superadminRoutes = require('../modules/superadmin/superadmin.routes');
const agencyPackageRoutes = require('../modules/agencyPackages/agencyPackage.routes');
const brandRoutes = require('../modules/accounts/brand.routes');

// Agency Restructure Placeholder Routes
const agencyBillingRoutes = require('../modules/accounts/agencyBilling.routes');
const agencyReportsRoutes = require('../modules/accounts/agencyReports.routes');
const agencySettingsRoutes = require('../modules/accounts/agencySettings.routes');
const agencyPerformanceRoutes = require('../modules/accounts/agencyPerformance.routes');
const agencySupportRoutes = require('../modules/accounts/agencySupport.routes');
const agencyUsersRoutes = require('../modules/accounts/agencyUsers.routes');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/agencies', agencyRoutes);
router.use('/brands', brandRoutes);

router.use('/agency/billing', agencyBillingRoutes);
router.use('/agency/reports', agencyReportsRoutes);
router.use('/agency/settings', agencySettingsRoutes);
router.use('/agency/performance', agencyPerformanceRoutes);
router.use('/agency/support', agencySupportRoutes);
router.use('/agency/users', agencyUsersRoutes);

router.use('/websites', websiteRoutes);
router.use('/funnels', funnelRoutes);
router.use('/stores', storeRoutes);
router.use('/forms', formRoutes);
router.use('/blogs', blogRoutes);
router.use('/qrs', qrRoutes);
router.use('/chat-widgets', widgetRoutes);
router.use('/domains', domainRoutes);
router.use('/templates', templateRoutes);
router.use('/agencies', agencyRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/integrations', integrationRoutes);
router.use('/users', userRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/agency-packages', agencyPackageRoutes);

module.exports = router;
