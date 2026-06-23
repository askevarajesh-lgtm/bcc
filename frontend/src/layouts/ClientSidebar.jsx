import React from 'react';
import { Layout, Menu, Drawer, Grid } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLayoutContext } from '../contexts/LayoutContext';
import { useFeatures } from '../contexts/FeatureContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Target, Users, CheckSquare, ShoppingCart, CreditCard, HelpCircle, Globe, BarChart2,
  Monitor, FileText, Sparkles, MessageCircle, TrendingUp, Zap, PieChart, GitMerge, LineChart, Lightbulb, Calendar, DollarSign, File, Store, Book, Library, Settings as SettingsIcon, Shield, Bell, Activity, Clock, Briefcase, Bot, Award, Palette, Search
} from 'lucide-react';

const { Sider } = Layout;

const ClientSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayoutContext();
  const { role } = useAuth();
  const screens = Grid.useBreakpoint();

  const { hasFeature } = useFeatures();

  const getIcon = (IconCmp) => <IconCmp size={16} strokeWidth={2} />;

  const getBadge = (text, type) => {
    let bg = 'var(--bg-tertiary)';
    let color = 'var(--text-secondary)';
    if (type === 'alert') { bg = 'rgba(239, 68, 68, 0.2)'; color = '#ef4444'; }
    if (type === 'warning') { bg = 'rgba(245, 158, 11, 0.2)'; color = '#f59e0b'; }
    if (type === 'success') { bg = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
    if (type === 'teal') { bg = 'rgba(13, 148, 136, 0.2)'; color = '#0d9488'; }

    return (
      <span style={{ 
        background: bg, color: color, padding: '2px 8px', borderRadius: 12, 
        fontSize: 10, fontWeight: 700, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4
      }}>
        {text}
      </span>
    );
  };

  const getLabel = (text, badgeText, badgeType) => {
    if (!badgeText) return text;
    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {text}
        {getBadge(badgeText, badgeType)}
      </div>
    );
  };

  let allMenuItems = [
    { 
      key: role === 'brand_super_admin' ? '/client/admin-dashboard' : role === 'brand_manager' ? '/client/manager-dashboard' : '/client/dashboard', 
      icon: getIcon(LayoutDashboard), 
      label: 'Command Center', 
      ...(['brand_super_admin', 'brand_manager'].includes(role) ? {} : { featureId: 'dashboard' }) 
    },
  ];

  if (['brand_super_admin', 'brand_manager'].includes(role)) {
    // Brand Admins/Managers see the exact same modules as the Main Admin panel, but prefixed with /client/
    // TODO (PHASE 2): Re-enable feature-based filtering (`featureId`) based on the brand's active package/subscription.
    // Currently, all modules are visible, but in Phase 2, this list should be filtered by enabled features.
    allMenuItems.push(
      { type: 'divider' },
      {
        key: 'clients',
        label: collapsed ? 'CLI' : 'CLIENTS',
        children: [
          // Accounts excluded
          { key: '/client/clients/sla', icon: getIcon(Shield), label: getLabel('SLA & Success', '3⚠', 'alert') },
          ...(role === 'brand_manager' ? [] : [
            { key: '/client/clients/portal', icon: getIcon(Monitor), label: 'Portal Settings' }
          ]),
        ],
      },
      { type: 'divider' },
      {
        key: 'workspace',
        label: collapsed ? 'WRK' : 'WORKSPACE',
        children: [
          { key: '/client/workspace/strategy', icon: getIcon(Target), label: 'Strategy' },
          { key: '/client/workspace/seo', icon: getIcon(Search), label: 'SEO / AEO / GEO' },
          { key: '/client/workspace/content', icon: getIcon(FileText), label: 'Content' },
          { key: '/client/workspace/aistudio', icon: getIcon(Palette), label: 'AI Studio' },
          { key: '/client/workspace/social', icon: getIcon(GitMerge), label: 'Social Media' },
          { key: '/client/workspace/ads', icon: getIcon(BarChart2), label: 'Performance Ads' },
          { key: '/client/workspace/crm', icon: getIcon(LineChart), label: getLabel('CRM & Leads', '142', 'default') },
          { key: '/client/workspace/automation', icon: getIcon(Zap), label: 'Automation' },
          { key: '/client/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' },
          { key: '/client/workspace/website', icon: getIcon(Globe), label: 'Websites' },
        ],
      },
      { type: 'divider' },
      {
        key: 'intelligence',
        label: collapsed ? 'INT' : 'INTELLIGENCE',
        children: [
          { key: '/client/intelligence/analytics', icon: getIcon(TrendingUp), label: 'Analytics & Attribution' },
          { key: '/client/intelligence/mos', icon: getIcon(Activity), label: getLabel('MOS Score', '68', 'warning') },
          { key: '/client/intelligence/copilot', icon: getIcon(MessageCircle), label: 'AI Co-Pilot' },
          { key: '/client/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'ChatGPT' },
          { key: '/client/intelligence/canva', icon: getIcon(Palette), label: 'Canva' },
          { key: '/client/intelligence/agents', icon: getIcon(Bot), label: getLabel('Ai Agent', 'teal') },
          { key: '/client/intelligence/benchmarks', icon: getIcon(Award), label: 'Benchmarks' },
          { key: '/client/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' },
        ],
      },
      { type: 'divider' },
      {
        key: 'ops',
        label: collapsed ? 'OPS' : 'AGENCY OPS',
        children: [
          { key: '/client/ops/team', icon: getIcon(Users), label: getLabel('People', '5', 'default') },
          { key: '/client/ops/time', icon: getIcon(Clock), label: 'Time Tracking' },
          { key: '/client/ops/resources', icon: getIcon(Calendar), label: 'Resources' },
          { key: '/client/ops/finance', icon: getIcon(CreditCard), label: 'Finance' },
          { key: '/client/ops/profitability', icon: getIcon(DollarSign), label: 'Profitability' },
          { key: '/client/ops/newbusiness', icon: getIcon(Briefcase), label: getLabel('New Business', '8', 'default') },
          { key: '/client/ops/businessintel', icon: getIcon(PieChart), label: 'Business Intel' },
        ],
      },
      { type: 'divider' },
      {
        key: 'settings',
        label: collapsed ? 'SET' : 'SETTINGS',
        children: [
          { key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' },
          { key: '/client/settings/marketplace', icon: getIcon(Store), label: 'Master Item' },
        ],
      }
    );
  } else {
    // Regular clients or team users see the full suite (filtered by features)
    allMenuItems.push(
      { key: '/client/performance', icon: getIcon(Target), label: 'My Performance', featureId: 'performance' },
      { key: '/client/leads', icon: getIcon(Users), label: 'Leads', featureId: 'leads' },
      { key: '/client/website', icon: getIcon(Globe), label: 'Website', featureId: 'website' },
      { key: '/client/tasks', icon: getIcon(CheckSquare), label: 'Tasks', featureId: 'tasks' },
      { key: '/client/store', icon: getIcon(ShoppingCart), label: 'Store', featureId: 'store' },
      { key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing', featureId: 'billing' },
      { key: '/client/support', icon: getIcon(HelpCircle), label: 'Support', featureId: 'support' }
    );
  }

  const menuItems = allMenuItems.filter(item => {
    if (item.type === 'divider') return true;
    if (item.children) {
      item.children = item.children.filter(child => !child.featureId || hasFeature(child.featureId));
      return item.children.length > 0;
    }
    return !item.featureId || hasFeature(item.featureId);
  });

  const getSelectedKeys = () => {
    // Exact match or active parent
    let match = menuItems.find(item => !item.children && location.pathname.startsWith(item.key));
    if (!match) {
      for (const group of menuItems) {
        if (group.children) {
          match = group.children.find(child => location.pathname.startsWith(child.key));
          if (match) break;
        }
      }
    }
    return match ? [match.key] : [role === 'brand_super_admin' ? '/client/admin-dashboard' : role === 'brand_manager' ? '/client/manager-dashboard' : '/client/dashboard'];
  };

  const sidebarContent = (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      width={280}
      theme={isDark ? 'dark' : 'light'}
      style={{
        borderRight: `1px solid var(--border-color)`,
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
        overflow: 'hidden',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', background: 'var(--bg-primary)', zIndex: 11, borderBottom: '1px solid var(--border-color)' }}>
        {collapsed ? (
          <div style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>PE</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>PE</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1, color: 'var(--text-primary)' }}>Prestige Estates</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--text-secondary)' }}>POWERED BY BCC MARTECH</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 'calc(100vh - 72px)', overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, paddingBottom: 60, paddingTop: 16 }}
        />
      </div>
    </Sider>
  );

  if (!screens.lg && screens.lg !== undefined) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0, overflow: 'hidden' }}
        width={280}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return sidebarContent;
};

export default ClientSidebar;
