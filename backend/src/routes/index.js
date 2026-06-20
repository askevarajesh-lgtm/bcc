const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const websiteRoutes = require('./websiteRoutes');
const funnelRoutes = require('./funnelRoutes');
const storeRoutes = require('./storeRoutes');
const formRoutes = require('./formRoutes');
const blogRoutes = require('./blogRoutes');
const qrRoutes = require('./qrRoutes');
const widgetRoutes = require('./widgetRoutes');
const domainRoutes = require('./domainRoutes');
const authRoutes = require('./authRoutes');
const templateRoutes = require('./templateRoutes');

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
