import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { FeatureProvider } from './contexts/FeatureContext';
import SignIn from './pages/SignIn/SignIn';

// Layouts
import AppLayout from './layouts/AppLayout';
import AgencyLayout from './layouts/AgencyLayout';
import ClientLayout from './layouts/ClientLayout';
import UserLayout from './layouts/UserLayout';
import PlaceholderPage from './components/PlaceholderPage';
import { 
  Users, HeartHandshake, Monitor, MessageCircle, TrendingUp, Zap, 
  CheckSquare, Globe, PieChart, BarChart2, GitMerge, LineChart, 
  Lightbulb, Calendar, DollarSign, File, Store, Book, Library, Shield, Bell, CreditCard, Activity, Bot, Award,
  Target, PenTool, Cpu, Share2, Megaphone, Inbox, Layout, Search
} from 'lucide-react';

// Admin Pages
import Dashboard from './pages/Dashboard/Dashboard';
import CRM from './pages/CRM/CRM';
import WebsiteBuilder from './pages/WebsiteBuilder/WebsiteBuilder';
import BuilderRouteWrapper from './pages/WebsiteBuilder/tabs/BuilderRouteWrapper';
import FormEmbedView from './pages/WebsiteBuilder/tabs/FormEmbedView';
import BlogEmbedView from './pages/WebsiteBuilder/tabs/BlogEmbedView';
import BlogPostEmbedView from './pages/WebsiteBuilder/tabs/BlogPostEmbedView';
import QREmbedView from './pages/WebsiteBuilder/tabs/QREmbedView';
import WebsitePreviewView from './pages/WebsiteBuilder/tabs/WebsitePreviewView';
import Strategy from './pages/Strategy/Strategy';
import SEO from './pages/SEO/SEO';
import Content from './pages/Content/Content';
import Creative from './pages/Creative/Creative';
import CampaignScheduledPage from './pages/Campaign Scheduled/CampaignScheduledPage';
import PerformanceAds from './pages/PerformanceAds/PerformanceAds';
import Accounts from './pages/Accounts/Accounts';
import SLA from './pages/SLA/SLA';
import PortalSettings from './pages/PortalSettings/PortalSettings';
import Analytics from './pages/Analytics/Analytics';
import Automation from './pages/Automation/Automation';
import TasksPage from './pages/Tasks/TasksPage';
import TaskForm from './pages/Tasks/TaskForm';
import ProjectList from './pages/projects/ProjectList';
import ProjectForm from './pages/projects/ProjectForm';
import ProjectDetail from './pages/projects/ProjectDetail';
import MasterItemsList from './pages/MasterItems/MasterItemsList';
import MasterItemForm from './pages/MasterItems/MasterItemForm';
import ProposalsList from './pages/Proposals/ProposalsList';
import ProposalForm from './pages/Proposals/ProposalForm';
import InvoicesList from './pages/Invoices/InvoicesList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import MeetingsPage from './pages/Meetings/MeetingsPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import DeliverablesPage from './pages/Deliverables/DeliverablesPage';

import Reports from './pages/Reports/Reports';
import Teams from './pages/Teams/Teams';
import TimeTracking from './pages/TimeTracking/TimeTracking';
import Resources from './pages/Resources/Resources';
import MOSScore from './pages/MOSScore/MOSScore';
import Finance from './pages/Finance/Finance';
import Profitability from './pages/Profitability/Profitability';
import SalesPipeline from './pages/SalesPipeline/SalesPipeline';
import BusinessIntel from './pages/BusinessIntel/BusinessIntel';
import SettingsPage from './pages/Settings/Settings';
import ClientSettingsTab from './pages/ClientPortal/tabs/ClientSettingsTab';
import AIAgents from './pages/AIAgents/AIAgents';
import AICopilot from './pages/AICopilot/AICopilot';
import Benchmarks from './pages/Benchmarks/Benchmarks';
import Marketplace from './pages/Marketplace/Marketplace';
import ClientChatGPTPage from './pages/ClientChatGPTPage/ClientChatGPTPage';
import ClientCanvaPage from './pages/ClientCanvaPage/ClientCanvaPage';

// Agency Portal Tabs
import OverviewTab from './pages/AgencyPortal/tabs/OverviewTab';
import AgencyAdminDashboardTab from './pages/AgencyPortal/tabs/AgencyAdminDashboardTab';
import ClientsTab from './pages/AgencyPortal/tabs/ClientsTab';
import AgencyPerformanceTab from './pages/AgencyPortal/tabs/PerformanceTab';
import AgencyTasksTab from './pages/AgencyPortal/tabs/TasksTab';
import AgencyBillingTab from './pages/AgencyPortal/tabs/BillingTab';
import AgencySupportTab from './pages/AgencyPortal/tabs/SupportTab';
import AgencyReportsTab from './pages/AgencyPortal/tabs/AgencyReportsTab';
import AgencySettingsTab from './pages/AgencyPortal/tabs/AgencySettingsTab';
import AgencyUsersTab from './pages/AgencyPortal/tabs/AgencyUsersTab';

// Client Portal Tabs
import ClientDashboardTab from './pages/ClientPortal/tabs/DashboardTab';
import BrandAdminDashboardTab from './pages/ClientPortal/tabs/BrandAdminDashboardTab';
import BrandManagerDashboardTab from './pages/ClientPortal/tabs/BrandManagerDashboardTab';
import BrandUsersTab from './pages/ClientPortal/tabs/BrandUsersTab';
import BillingTab from './pages/ClientPortal/tabs/BillingTab';
import ClientPerformanceTab from './pages/ClientPortal/tabs/MyPerformanceTab';
import ClientLeadsTab from './pages/ClientPortal/tabs/LeadsTab';
import ClientTasksTab from './pages/ClientPortal/tabs/TasksTab';
import BrandSettingsTab from './pages/ClientPortal/tabs/BrandSettingsTab';
import ClientStoreTab from './pages/ClientPortal/tabs/StoreTab';
import ClientBillingTab from './pages/ClientPortal/tabs/BillingTab';
import ClientSupportTab from './pages/ClientPortal/tabs/SupportTab';
import ClientWebsiteTab from './pages/ClientPortal/tabs/ClientWebsiteTab';
import TeamTab from './pages/ClientPortal/tabs/TeamTab';
import ClientReportsTab from './pages/ClientPortal/tabs/ReportsTab';

// User Portal Tabs
import UserDashboardTab from './pages/UserPortal/DashboardTab';
import UserSettingsTab from './pages/UserPortal/SettingsTab';

// Super Admin Layout and Pages
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminCompanies from './pages/SuperAdmin/Companies';
import SuperAdminSubscriptions from './pages/SuperAdmin/Subscriptions';
import SuperAdminIntegrations from './pages/SuperAdmin/Integrations';
import SuperAdminAdmins from './pages/SuperAdmin/Admins';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { role } = useAuth();
  
  if (!role) {
    return <Navigate to="/signin" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (['supreme_super_admin', 'superadmin'].includes(role)) return <Navigate to="/superadmin/dashboard" replace />;
    if (role === 'commander_admin') return <Navigate to="/dashboard" replace />;
    if (role === 'agency_super_admin') return <Navigate to="/agency/admin-overview" replace />;
    if (['agency_manager', 'agency'].includes(role)) return <Navigate to="/agency/overview" replace />;
    if (role === 'brand_super_admin') return <Navigate to="/client/admin-dashboard" replace />;
    if (role === 'brand_manager') return <Navigate to="/client/manager-dashboard" replace />;
    if (['agency_client', 'brand_team_user', 'client'].includes(role)) return <Navigate to="/client/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }
  
  return <Outlet />;
};

const AppRoutes = () => {
  const { role } = useAuth();
  
  return (
    <Routes>
      <Route path="/signin" element={role ? (
        <Navigate to={
          ['supreme_super_admin', 'superadmin'].includes(role) ? '/superadmin/dashboard' : 
          role === 'commander_admin' ? '/dashboard' : 
          role === 'agency_super_admin' ? '/agency/admin-overview' :
          ['agency_manager', 'agency'].includes(role) ? '/agency/overview' : 
          role === 'brand_super_admin' ? '/client/admin-dashboard' :
          role === 'brand_manager' ? '/client/manager-dashboard' :
          ['agency_client', 'brand_team_user', 'client'].includes(role) ? '/client/dashboard' :
          '/user/dashboard'
        } replace />
      ) : <SignIn />} />
      
      {/* Public / Embed Routes */}
      <Route path="/embed/form/:formId" element={<FormEmbedView />} />
      <Route path="/embed/blog/:blogId" element={<BlogEmbedView />} />
      <Route path="/embed/qr/:qrId" element={<QREmbedView />} />
      <Route path="/blog/:blogSlug" element={<BlogEmbedView />} />
      <Route path="/blog/:blogSlug/:postSlug" element={<BlogPostEmbedView />} />
      <Route path="/preview/website/:websiteId/page/:pageId" element={<WebsitePreviewView />} />
      
      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['supreme_super_admin', 'superadmin']} />}>
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="companies" element={<SuperAdminCompanies />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
          <Route path="integrations" element={<SuperAdminIntegrations />} />
          
          <Route path="admins" element={<SuperAdminAdmins />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['supreme_super_admin', 'superadmin', 'commander_admin']} />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="clients/accounts" element={<Accounts />} />
          <Route path="clients/sla" element={<SLA />} />
          <Route path="clients/portal" element={<PortalSettings />} />

          <Route path="workspace/strategy" element={<Strategy />} />
          <Route path="workspace/seo" element={<SEO />} />
          <Route path="workspace/content" element={<Content />} />
          <Route path="workspace/aistudio" element={<Creative />} />
          <Route path="workspace/social" element={<CampaignScheduledPage />} />
          <Route path="workspace/ads" element={<PerformanceAds />} />
          <Route path="workspace/crm" element={<CRM />} />
          <Route path="workspace/automation" element={<Automation />} />
          <Route path="workspace/tasks" element={<TasksPage />} />
          <Route path="workspace/tasks/new" element={<TaskForm />} />
          <Route path="workspace/tasks/:id/edit" element={<TaskForm />} />
          <Route path="workspace/projects" element={<ProjectList />} />
          <Route path="workspace/projects/new" element={<ProjectForm />} />
          <Route path="workspace/projects/:id" element={<ProjectDetail />} />
          <Route path="workspace/projects/:id/edit" element={<ProjectForm />} />
          <Route path="workspace/master-items" element={<MasterItemsList />} />
          <Route path="workspace/master-items/new" element={<MasterItemForm />} />
          <Route path="workspace/master-items/:id" element={<MasterItemForm />} />
          <Route path="workspace/proposals" element={<ProposalsList />} />
          <Route path="workspace/proposals/new" element={<ProposalForm />} />
          <Route path="workspace/proposals/:id" element={<ProposalForm />} />
          <Route path="workspace/invoices" element={<InvoicesList />} />
          <Route path="workspace/invoices/new" element={<InvoiceForm />} />
          <Route path="workspace/invoices/:id" element={<InvoiceForm />} />
          <Route path="workspace/website/*" element={<WebsiteBuilder />} />
          <Route path="workspace/website/:websiteId/pages/:pageId/edit" element={<BuilderRouteWrapper />} />

          <Route path="intelligence/analytics" element={<Analytics />} />
          <Route path="intelligence/mos" element={<MOSScore />} />
          <Route path="intelligence/copilot" element={<AICopilot />} />
          <Route path="intelligence/chatgpt" element={<ClientChatGPTPage />} />
          <Route path="intelligence/canva" element={<ClientCanvaPage />} />
          <Route path="intelligence/agents" element={<AIAgents />} />
          <Route path="intelligence/benchmarks" element={<Benchmarks />} />
          <Route path="intelligence/reporting" element={<Reports />} />

          <Route path="ops/team" element={<Teams />} />
          <Route path="ops/time" element={<TimeTracking />} />
          <Route path="ops/resources" element={<Resources />} />
          <Route path="ops/finance" element={<Finance />} />
          <Route path="ops/profitability" element={<Profitability />} />
          <Route path="ops/salespipeline" element={<SalesPipeline />} />
          <Route path="ops/businessintel" element={<BusinessIntel />} />
          <Route path="ops/meetings" element={<MeetingsPage />} />
          <Route path="ops/calendar" element={<CalendarPage />} />
          <Route path="ops/deliverables" element={<DeliverablesPage />} />

          <Route path="settings/company" element={<SettingsPage />} />
          <Route path="settings/marketplace" element={<Marketplace />} />
          <Route path="settings/users" element={<PlaceholderPage title="User Settings" description="Manage user preferences." icon={Users} />} />
          <Route path="settings/roles" element={<PlaceholderPage title="Roles & Permissions" description="Define role-based access control." icon={Shield} />} />
          <Route path="settings/integrations" element={<PlaceholderPage title="Integrations" description="Connect third-party apps and APIs." icon={Zap} />} />
          <Route path="settings/notifications" element={<PlaceholderPage title="Notifications" description="Configure email and in-app alerts." icon={Bell} />} />
          <Route path="settings/billing" element={<PlaceholderPage title="Billing" description="Manage subscription plans and payment methods." icon={CreditCard} />} />
          <Route path="settings/audit" element={<PlaceholderPage title="Audit Logs" description="Review system activity and security events." icon={Activity} />} />
        </Route>
      </Route>

      {/* Agency Routes */}
      <Route element={<ProtectedRoute allowedRoles={['supreme_super_admin', 'superadmin', 'agency_super_admin', 'agency_manager', 'agency']} />}>
        <Route path="/agency" element={<AgencyLayout />}>
          <Route index element={<Navigate to={role === 'agency_super_admin' ? "/agency/admin-overview" : "/agency/overview"} replace />} />
          <Route path="admin-overview" element={<AgencyAdminDashboardTab />} />
          <Route path="overview" element={<OverviewTab />} />
          <Route path="clients" element={<ClientsTab />} />
          <Route path="performance" element={<AgencyPerformanceTab />} />
          <Route path="tasks" element={<AgencyTasksTab />} />
          <Route path="billing" element={<AgencyBillingTab />} />
          <Route path="reports" element={<AgencyReportsTab />} />
          <Route path="settings" element={role === 'agency_super_admin' ? <AgencySettingsTab /> : <SettingsPage />} />
          <Route path="users" element={<AgencyUsersTab />} />
          <Route path="support" element={<AgencySupportTab />} />
          
          {/* Agency Manager Dynamic Modules */}
          <Route path="sla" element={<SLA />} />
          <Route path="strategy" element={<Strategy />} />
          <Route path="seo" element={<SEO />} />
          <Route path="content" element={<Content />} />
          <Route path="ai-studio" element={<Creative />} />
          <Route path="social-media" element={<CampaignScheduledPage />} />
          <Route path="performance-ads" element={<PerformanceAds />} />
          <Route path="crm" element={<CRM />} />
          <Route path="automation" element={<Automation />} />
          <Route path="master-items" element={<MasterItemsList />} />
          <Route path="master-items/new" element={<MasterItemForm />} />
          <Route path="master-items/:id" element={<MasterItemForm />} />
          <Route path="proposals" element={<ProposalsList />} />
          <Route path="proposals/new" element={<ProposalForm />} />
          <Route path="proposals/:id" element={<ProposalForm />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/new" element={<InvoiceForm />} />
          <Route path="invoices/:id" element={<InvoiceForm />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectForm />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/edit" element={<ProjectForm />} />
          <Route path="workspace/tasks" element={<TasksPage />} />
          <Route path="workspace/tasks/new" element={<TaskForm />} />
          <Route path="workspace/tasks/:id/edit" element={<TaskForm />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="deliverables" element={<DeliverablesPage />} />
        </Route>
      </Route>

      {/* Client Routes */}
      <Route element={<ProtectedRoute allowedRoles={['supreme_super_admin', 'superadmin', 'agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client']} />}>
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to={
            role === 'brand_super_admin' ? "/client/admin-dashboard" :
            role === 'brand_manager' ? "/client/manager-dashboard" :
            "/client/dashboard"
          } replace />} />
          <Route path="admin-dashboard" element={<BrandAdminDashboardTab />} />
          <Route path="manager-dashboard" element={<BrandManagerDashboardTab />} />
          <Route path="users" element={<BrandUsersTab />} />
          <Route path="billing" element={<BillingTab />} />
          
          <Route path="dashboard" element={<ClientDashboardTab />} />
          
          {/* Brand Admin / Manager Additional Modules */}
          <Route path="clients/sla" element={<SLA />} />
          {role !== 'brand_manager' && (
            <Route path="clients/portal" element={<PortalSettings />} />
          )}

          <Route path="workspace/strategy" element={<Strategy />} />
          <Route path="workspace/seo" element={<SEO />} />
          <Route path="workspace/content" element={<Content />} />
          <Route path="workspace/aistudio" element={<Creative />} />
          <Route path="workspace/social" element={<CampaignScheduledPage />} />
          <Route path="workspace/ads" element={<PerformanceAds />} />
          <Route path="workspace/crm" element={<CRM />} />
          <Route path="workspace/automation" element={<Automation />} />
          <Route path="workspace/tasks" element={<TasksPage />} />
          <Route path="workspace/tasks/new" element={<TaskForm />} />
          <Route path="workspace/tasks/:id/edit" element={<TaskForm />} />
          <Route path="workspace/projects" element={<ProjectList />} />
          <Route path="workspace/projects/new" element={<ProjectForm />} />
          <Route path="workspace/projects/:id" element={<ProjectDetail />} />
          <Route path="workspace/projects/:id/edit" element={<ProjectForm />} />
          <Route path="workspace/master-items" element={<MasterItemsList />} />
          <Route path="workspace/master-items/new" element={<MasterItemForm />} />
          <Route path="workspace/master-items/:id" element={<MasterItemForm />} />
          <Route path="workspace/proposals" element={<ProposalsList />} />
          <Route path="workspace/proposals/new" element={<ProposalForm />} />
          <Route path="workspace/proposals/:id" element={<ProposalForm />} />
          <Route path="workspace/invoices" element={<InvoicesList />} />
          <Route path="workspace/invoices/new" element={<InvoiceForm />} />
          <Route path="workspace/invoices/:id" element={<InvoiceForm />} />
          
          <Route path="workspace/website/*" element={<WebsiteBuilder />} />
          <Route path="workspace/website/:websiteId/pages/:pageId/edit" element={<BuilderRouteWrapper />} />

          <Route path="intelligence/analytics" element={<Analytics />} />
          <Route path="intelligence/mos" element={<MOSScore />} />
          <Route path="intelligence/copilot" element={<AICopilot />} />
          <Route path="intelligence/chatgpt" element={<ClientChatGPTPage />} />
          <Route path="intelligence/canva" element={<ClientCanvaPage />} />
          <Route path="intelligence/agents" element={<AIAgents />} />
          <Route path="intelligence/benchmarks" element={<Benchmarks />} />
          <Route path="intelligence/reporting" element={<Reports />} />

          <Route path="ops/team" element={<Teams />} />
          <Route path="ops/time" element={<TimeTracking />} />
          <Route path="ops/resources" element={<Resources />} />
          <Route path="ops/finance" element={<Finance />} />
          <Route path="ops/profitability" element={<Profitability />} />
          <Route path="ops/salespipeline" element={<SalesPipeline />} />
          <Route path="ops/businessintel" element={<BusinessIntel />} />

          <Route path="settings/company" element={
            role === 'brand_super_admin' ? <BrandSettingsTab /> : 
            role === 'agency_client' ? <ClientSettingsTab /> : 
            <SettingsPage />
          } />
          <Route path="settings/marketplace" element={<Marketplace />} />
          <Route path="settings/users" element={<PlaceholderPage title="User Settings" description="Manage user preferences." icon={Users} />} />
          <Route path="settings/roles" element={<PlaceholderPage title="Roles & Permissions" description="Define role-based access control." icon={Shield} />} />
          <Route path="settings/integrations" element={<PlaceholderPage title="Integrations" description="Connect third-party apps and APIs." icon={Zap} />} />
          <Route path="settings/notifications" element={<PlaceholderPage title="Notifications" description="Configure email and in-app alerts." icon={Bell} />} />
          <Route path="settings/billing" element={<PlaceholderPage title="Billing" description="Manage subscription plans and payment methods." icon={CreditCard} />} />
          <Route path="settings/audit" element={<PlaceholderPage title="Audit Logs" description="Review system activity and security events." icon={Activity} />} />
          <Route path="performance" element={<ClientPerformanceTab />} />
          <Route path="leads" element={<ClientLeadsTab />} />
          <Route path="website/*" element={<ClientWebsiteTab />} />
          <Route path="team" element={<TeamTab />} />
          <Route path="tasks" element={<ClientTasksTab />} />
          <Route path="store" element={<ClientStoreTab />} />
          <Route path="billing" element={<ClientBillingTab />} />
          <Route path="reports" element={<ClientReportsTab />} />
          <Route path="support" element={<ClientSupportTab />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="deliverables" element={<DeliverablesPage />} />
        </Route>
      </Route>

      {/* User Routes */}
      <Route path="/user" element={
        <ProtectedRoute />
      }>
        <Route element={<UserLayout />}>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardTab />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id/edit" element={<TaskForm />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="settings" element={<UserSettingsTab />} />
        </Route>
      </Route>



      {/* Catch all - Redirect to sign in if no role, otherwise to respective dashboard */}
      <Route path="*" element={<ProtectedRoute allowedRoles={['supreme_super_admin', 'superadmin', 'commander_admin', 'agency_super_admin', 'agency_manager', 'agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'agency', 'client']} />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <FeatureProvider>
          <LayoutProvider>
            <AppRoutes />
          </LayoutProvider>
        </FeatureProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
