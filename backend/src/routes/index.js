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

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/funnels', funnelRoutes);
router.use('/stores', storeRoutes);
router.use('/forms', formRoutes);
router.use('/blogs', blogRoutes);
router.use('/qrs', qrRoutes);
router.use('/chat-widgets', widgetRoutes);
router.use('/domains', domainRoutes);
router.use('/templates', templateRoutes);

module.exports = router;
