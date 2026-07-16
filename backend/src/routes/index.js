const express = require('express');
const router = express.Router();
const healthRoutes = require('../modules/health/health.routes');
const websiteRoutes = require('../modules/websites/website.routes');
const funnelRoutes = require('../modules/funnels/funnel.routes');
const storeRoutes = require('../modules/stores/store.routes');
const formRoutes = require('../modules/forms/form.routes');
const formTemplateRoutes = require('../modules/forms/form-template.routes');
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
const commanderRoutes = require('../modules/commander/commander.routes');
const agencyPackageRoutes = require('../modules/agencyPackages/agencyPackage.routes');
const directClientPackageRoutes = require('../modules/agencyPackages/directClientPackage.routes');
const brandRoutes = require('../modules/accounts/brand.routes');
const departmentRoutes = require('../modules/departments/department.routes');
const roleRoutes = require('../modules/roles/role.routes');
const mediaRoutes = require('../modules/media/media.routes');
const taskRoutes = require('../modules/tasks/task.routes');
const coordinatorTaskRoutes = require('../modules/tasks/coordinatorTask.routes');
const projectRoutes = require('../modules/projects/project.routes');
const campaignScheduledRoutes = require('../modules/campaign-scheduled/campaignScheduled.routes');
const slaRoutes = require('../modules/sla/sla.routes');
const mosRoutes = require('../modules/mos/mos.routes');
const benchmarkRoutes = require('../modules/benchmarking/benchmark.routes');
const hrmsRoutes = require('../modules/hrms/hrms.routes');

// CRM Workflow Routes
const masterItemRoutes = require('../modules/masterItems/masterItem.routes');
const proposalRoutes = require('../modules/proposals/proposal.routes');
const invoiceRoutes = require('../modules/invoices/invoice.routes');
const leadRoutes = require('../modules/leads/lead.routes');
const salesPipelineRoutes = require('../modules/salesPipeline/salesPipeline.routes');

// Agency Restructure Placeholder Routes
const agencyBillingRoutes = require('../modules/accounts/agencyBilling.routes');
const agencyReportsRoutes = require('../modules/accounts/agencyReports.routes');
const agencySettingsRoutes = require('../modules/accounts/agencySettings.routes');
const agencyPerformanceRoutes = require('../modules/accounts/agencyPerformance.routes');
const agencySupportRoutes = require('../modules/accounts/agencySupport.routes');
const agencyUsersRoutes = require('../modules/accounts/agencyUsers.routes');
const clientPackageRoutes = require('../modules/accounts/clientPackage.routes');
const supportRoutes = require('../modules/support/support.routes');
const strategyRoutes = require('../modules/strategy/strategy.routes');
const performanceAdsRoutes = require('../modules/performanceAds/performanceAds.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const reportRoutes = require('../modules/reports/report.routes');
const seoIntelligenceRoutes = require('../modules/seoIntelligence/seoIntelligence.routes');
const seoWorkspaceRoutes = require('../modules/seoWorkspace/seoWorkspace.routes');

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
router.use('/agency-packages', agencyPackageRoutes);
router.use('/agency/client-packages', clientPackageRoutes);
router.use('/direct-packages', directClientPackageRoutes);
router.use('/strategy', strategyRoutes);
router.use('/performance-ads', performanceAdsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/mos', mosRoutes);
router.use('/benchmark', benchmarkRoutes);
router.use('/reports', reportRoutes);
router.use('/seo-intelligence', seoIntelligenceRoutes);
router.use('/seo-workspace', seoWorkspaceRoutes);
router.use('/time-tracking', require('../modules/timeTracking/timeTracking.routes'));
router.use('/resources', require('../modules/resources/resources.routes'));
router.use('/business-intel', require('../modules/businessIntel/businessIntel.routes'));
router.use('/websites', websiteRoutes);
router.use('/funnels', funnelRoutes);
router.use('/stores', storeRoutes);
router.use('/forms', formRoutes);
router.use('/support', supportRoutes);
router.use('/form-templates', formTemplateRoutes);
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
router.use('/commander', commanderRoutes);
router.use('/agency-packages', agencyPackageRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/media', mediaRoutes);
router.use('/tasks', taskRoutes);
router.use('/coordinator-tasks', coordinatorTaskRoutes);
router.use('/projects', projectRoutes);
router.use('/campaign-scheduled', campaignScheduledRoutes);
router.use('/sla-success', slaRoutes);
router.use('/hrms', hrmsRoutes);

// CRM Workflow Mounts
router.use('/master-items', masterItemRoutes);
router.use('/proposals', proposalRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/leads', leadRoutes);
router.use('/sales-pipeline', salesPipelineRoutes);

// Meetings Mount
router.use('/meetings', require('../modules/meetings/meeting.routes'));

// Calendar Mount
router.use('/calendar', require('../modules/calendar/calendar.routes'));

// Deliverables Mount
router.use('/deliverables', require('../modules/deliverables/deliverables.routes'));

// AI Studio Mount
router.use('/ai-studio', require('../modules/aiStudio/aiStudio.routes'));

// Content Mount
router.use('/content', require('../modules/content/content.routes'));

// Sidebar Mount
router.use('/sidebar', require('../modules/sidebar/sidebar.routes'));

module.exports = router;