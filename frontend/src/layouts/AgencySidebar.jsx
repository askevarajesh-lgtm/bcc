import React from 'react';
import { Layout, Menu, Drawer, Grid } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLayoutContext } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, CreditCard, Shield, FileText, Settings, 
  TrendingUp, HelpCircle, Activity, Layout as LayoutIcon, Target, Search, PenTool, 
  Cpu, Share2, Megaphone, Inbox, Zap, CheckSquare, Library, Store 
} from 'lucide-react';

const { Sider } = Layout;

const AgencySidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayoutContext();
  const { role, features } = useAuth();
  const screens = Grid.useBreakpoint();

  const getIcon = (IconCmp) => <IconCmp size={16} strokeWidth={2} />;

  let menuItems = [];

  if (role === 'agency_super_admin') {
    menuItems = [
      { key: '/agency/admin-overview', icon: getIcon(LayoutDashboard), label: 'Dashboard' },
      { key: '/agency/performance', icon: getIcon(TrendingUp), label: 'Performance' },
      { key: '/agency/billing', icon: getIcon(CreditCard), label: 'Billing' },
      { key: '/agency/reports', icon: getIcon(FileText), label: 'Reports' },
      { key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' },
      { key: '/agency/users', icon: getIcon(Shield), label: 'User Management' },
      { key: '/agency/support', icon: getIcon(HelpCircle), label: 'Support' },
    ];
  } else {
    // Agency Manager items built dynamically from features array
    const feats = features || [];
    
    // Command Center
    if (feats.includes('dashboard') || feats.length === 0) {
      menuItems.push({ key: '/agency/overview', icon: getIcon(LayoutDashboard), label: 'Command Center' });
    }

    // Clients Group
    if (feats.includes('clients') || feats.length === 0) {
      menuItems.push({
        key: 'clients-group',
        type: 'group',
        label: 'CLIENTS',
        children: [
          { key: '/agency/clients', icon: getIcon(Users), label: 'Accounts' },
          { key: '/agency/sla', icon: getIcon(Activity), label: 'SLA & Success' },
        ]
      });
    }

    // Workspace Group
    const workspaceChildren = [];
    if (feats.includes('settings') || feats.length === 0) workspaceChildren.push({ key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' });
    if (feats.includes('strategy') || feats.length === 0) workspaceChildren.push({ key: '/agency/strategy', icon: getIcon(Target), label: 'Strategy' });
    if (feats.includes('seo') || feats.length === 0) workspaceChildren.push({ key: '/agency/seo', icon: getIcon(Search), label: 'SEO / AEO / GEO' });
    if (feats.includes('content') || feats.length === 0) workspaceChildren.push({ key: '/agency/content', icon: getIcon(PenTool), label: 'Content' });
    if (feats.includes('aistudio') || feats.length === 0) workspaceChildren.push({ key: '/agency/ai-studio', icon: getIcon(Cpu), label: 'AI Studio' });
    if (feats.includes('social') || feats.length === 0) workspaceChildren.push({ key: '/agency/social-media', icon: getIcon(Share2), label: 'Social Media' });
    if (feats.includes('ads') || feats.length === 0) workspaceChildren.push({ key: '/agency/performance-ads', icon: getIcon(Megaphone), label: 'Performance Ads' });
    const hasAgencyFullAccess = ['agency_manager', 'agency_super_admin'].includes(role);
    
    if (feats.includes('crm') || feats.length === 0 || hasAgencyFullAccess) {
      workspaceChildren.push({ key: '/agency/crm', icon: getIcon(Inbox), label: 'CRM & Leads' });
      workspaceChildren.push({ key: '/agency/proposals', icon: getIcon(FileText), label: 'Proposals' });
      workspaceChildren.push({ key: '/agency/invoices', icon: getIcon(CreditCard), label: 'Invoices' });
      workspaceChildren.push({ key: '/agency/projects', icon: getIcon(Library), label: 'Projects' });
      workspaceChildren.push({ key: '/agency/master-items', icon: getIcon(Store), label: 'Master Item' });
    }
    if (feats.includes('automation') || feats.length === 0) workspaceChildren.push({ key: '/agency/automation', icon: getIcon(Zap), label: 'Automation' });
    if (feats.includes('tasks') || feats.length === 0 || hasAgencyFullAccess) workspaceChildren.push({ key: '/agency/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' });

    if (workspaceChildren.length > 0) {
      menuItems.push({
        key: 'workspace-group',
        type: 'group',
        label: 'WORKSPACE',
        children: workspaceChildren
      });
    }
  }

  const getSelectedKeys = () => {
    // Determine base paths to match against to handle sub-routes correctly
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      const baseRoute = `/${pathSegments[0]}/${pathSegments[1]}`;
      return [baseRoute];
    }
    return [role === 'agency_super_admin' ? '/agency/admin-overview' : '/agency/overview'];
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
          <div style={{ background: '#3b82f6', color: '#fff', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>BCC</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ background: '#3b82f6', color: '#fff', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>BCC</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1, color: 'var(--text-primary)' }}>BCC Martech</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--text-secondary)' }}>AGENCY PORTAL</span>
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

export default AgencySidebar;
