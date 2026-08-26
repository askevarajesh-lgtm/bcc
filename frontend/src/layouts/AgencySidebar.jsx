import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  Calendar,
  CheckSquare,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  PenTool,
  PieChart,
  Search,
  Settings,
  Share2,
  Shield,
  Store,
  Target,
  TrendingUp,
  Users,
  Zap,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PortalSidebar from './PortalSidebar';
import { slaApi } from '../api/slaApi';

const AgencySidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, features, user } = useAuth();

  const [slaCount, setSlaCount] = React.useState(0);

  React.useEffect(() => {
    const fetchSlaCount = async () => {
      try {
        const res = await slaApi.getSlaDashboardStats();
        if (res && res.data && res.data.stats) {
          const { total, resolved } = res.data.stats;
          setSlaCount(total - resolved);
        }
      } catch (error) {
        console.error('Failed to fetch SLA stats for sidebar', error);
      }
    };
    fetchSlaCount();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const dynamicAgencyName = user?.agencyName || user?.companyName || 'M1 Labs';
  const dynamicAgencyInitials = dynamicAgencyName.substring(0, 2).toUpperCase();

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  const getBadge = (text, type = 'neutral') => (
    <span className={`sidebar-menu-badge sidebar-menu-badge--${type}`}>{text}</span>
  );

  const getLabel = (text, badgeText, badgeType) => {
    if (!badgeText) return text;
    return (
      <div className="sidebar-menu-label">
        <span className="sidebar-menu-text">{text}</span>
        {!collapsed && getBadge(badgeText, badgeType)}
      </div>
    );
  };

  let menuItems = [
    {
      key: role === 'agency_super_admin' ? '/agency/admin-overview' : '/agency/overview',
      icon: getIcon(LayoutDashboard),
      label: 'Command Center',
    }
  ];

  const feats = features || [];
  const hasAgencyFullAccess = ['agency_manager', 'agency_super_admin'].includes(role);

  if (hasAgencyFullAccess || feats.includes('clients')) {
    menuItems.push({
      key: 'clients',
      label: 'CLIENTS',
      icon: getIcon(Users),
      children: [
        { key: '/agency/clients', icon: getIcon(Users), label: 'Accounts' },
        ...(['agency_super_admin', 'agency_manager'].includes(role) ? [
          { key: '/agency/sla', icon: getIcon(Activity), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') }
        ] : []),
      ],
    });
  }

  const workspaceChildren = [];

  if (role !== 'agency_super_admin') {
    if (feats.includes('strategy')) workspaceChildren.push({ key: '/agency/strategy', icon: getIcon(Target), label: 'Strategy' });
    if (feats.includes('aistudio')) workspaceChildren.push({ key: '/agency/ai-studio', icon: getIcon(Zap), label: 'AI Studio' });
    if (feats.includes('social')) workspaceChildren.push({ key: '/agency/social-media', icon: getIcon(Share2), label: 'Social Media' });
    if (feats.includes('ads')) workspaceChildren.push({ key: '/agency/performance-ads', icon: getIcon(Megaphone), label: 'Performance Ads' });

    if (feats.includes('crm')) {
      workspaceChildren.push({ key: '/agency/crm', icon: getIcon(Inbox), label: 'CRM & Leads' });
    }

    // Default modules always available
    workspaceChildren.push({ key: '/agency/proposals', icon: getIcon(FileText), label: 'Proposals' });
    workspaceChildren.push({
      key: 'task_management',
      label: 'Task Management',
      icon: getIcon(CheckSquare),
      children: [
        { key: '/agency/projects', label: 'Projects' },
        { key: '/agency/workspace/tasks', label: 'Tasks' },
        { key: '/agency/workspace/tasks/analytics', label: 'Task Analytics' },
        { key: '/agency/workspace/tasks/coordinator', label: 'Coordinator Tasks' },
      ]
    });
    if (feats.includes('website')) workspaceChildren.push({ key: '/agency/website', icon: getIcon(LayoutDashboard), label: 'Websites' });
    if (['agency_manager', 'agency'].includes(role)) {
      workspaceChildren.push({
        key: '/agency/marketplace',
        icon: getIcon(Store),
        label: 'Marketplace',
      });
    }
    if (feats.includes('seo-panel') || ['agency_super_admin', 'agency_manager'].includes(role)) {
      workspaceChildren.push({ key: '/agency/workspace/seo-panel', icon: getIcon(Search), label: 'SEO Panel' });
    }
  }

  if (workspaceChildren.length > 0) {
    menuItems.push({
      key: 'workspace',
      label: 'WORKSPACE',
      icon: getIcon(Briefcase),
      children: workspaceChildren,
    });
  }

  const intelligenceChildren = [];
  if (role !== 'agency_super_admin') {
    if (feats.includes('analytics')) intelligenceChildren.push({ key: '/agency/analytics', icon: getIcon(TrendingUp), label: 'Google Analytics' });
    if (feats.includes('chatgpt')) intelligenceChildren.push({ key: '/agency/chatgpt', icon: getIcon(HelpCircle), label: 'ChatGPT' });
    if (feats.includes('canva')) intelligenceChildren.push({ key: '/agency/canva', icon: getIcon(PenTool), label: 'Canva' });
    if (feats.includes('seo-aeo-geo')) intelligenceChildren.push({ key: '/agency/seo-aeo-geo', icon: getIcon(Search), label: 'SEO/AEO/GEO' });
    // if (feats.includes('benchmark')) intelligenceChildren.push({ key: '/agency/benchmarks', icon: getIcon(Activity), label: 'Benchmark' });
  }

  if (role === 'agency_super_admin') {
    intelligenceChildren.push({ key: '/agency/performance', icon: getIcon(TrendingUp), label: 'Performance' });
  }

  if (intelligenceChildren.length > 0) {
    menuItems.push({
      key: 'intelligence',
      label: 'INTELLIGENCE',
      icon: getIcon(Zap),
      children: intelligenceChildren,
    });
  }

  const opsChildren = [];
  opsChildren.push({ key: '/agency/time', icon: getIcon(Calendar), label: 'Time Tracking' });
  opsChildren.push({ key: '/agency/salespipeline', icon: getIcon(Briefcase), label: 'Sales Pipeline' });
  opsChildren.push({ key: '/agency/meetings', icon: getIcon(Calendar), label: 'Meetings' });
  opsChildren.push({ key: '/agency/calendar', icon: getIcon(Calendar), label: 'Calendar' });
  opsChildren.push({ key: '/agency/deliverables', icon: getIcon(FileText), label: 'Deliverables' });

  if (opsChildren.length > 0) {
    menuItems.push({
      key: 'ops',
      label: 'AGENCY OPS',
      icon: getIcon(Activity),
      children: opsChildren,
    });
  }

  const accountsChildren = [];
  accountsChildren.push({ key: '/agency/invoices', icon: getIcon(CreditCard), label: 'Invoices' });
  accountsChildren.push({ key: '/agency/accounts/transactions', icon: getIcon(CreditCard), label: 'Transactions' });
  accountsChildren.push({ key: '/agency/accounts/sales-tracking', icon: getIcon(TrendingUp), label: 'Sales Tracking' });
  accountsChildren.push({ key: '/agency/accounts/expenses', icon: getIcon(FileText), label: 'Expenses Management' });
  accountsChildren.push({ key: '/agency/accounts/campaign-expenses', icon: getIcon(DollarSign), label: 'Campaign Expenses' });
  accountsChildren.push({ key: '/agency/accounts/pl-analytics', icon: getIcon(PieChart), label: 'P&L Analytics' });

  if (accountsChildren.length > 0) {
    menuItems.push({
      key: 'accounts',
      label: 'ACCOUNTS',
      icon: getIcon(CreditCard),
      children: accountsChildren,
    });
  }

  const hrmsChildren = [];
  if (feats.includes('hrms')) {
    hrmsChildren.push({ key: '/agency/hrms/staff', icon: getIcon(Users), label: 'Staff' });
    hrmsChildren.push({ key: '/agency/hrms/attendance', icon: getIcon(ClipboardList), label: 'Attendance' });
  }

  if (['agency_super_admin', 'agency_manager', 'agency'].includes(role)) {
    hrmsChildren.push({ key: '/agency/hrms/performance', icon: getIcon(Activity), label: 'Performance' });
    hrmsChildren.push({ key: '/agency/hrms/daily-reports', icon: getIcon(FileText), label: 'Daily Reports' });
  }

  if (hrmsChildren.length > 0) {
    menuItems.push({
      key: 'hrms',
      label: 'HRMS',
      icon: getIcon(ClipboardList),
      children: hrmsChildren,
    });
  }

  const settingsChildren = [];
  if (feats.includes('master-items') || hasAgencyFullAccess) settingsChildren.push({ key: '/agency/master-items', icon: getIcon(Store), label: 'Master Item' });
  if (role === 'agency_super_admin') {
    settingsChildren.push({ key: '/agency/users', icon: getIcon(Shield), label: 'Manager' });
    settingsChildren.push({ key: '/agency/billing', icon: getIcon(CreditCard), label: 'Billing' });
  }
  if (['agency_super_admin', 'agency_manager', 'agency_client'].includes(role)) {
    settingsChildren.push({ key: '/agency/support', icon: getIcon(HelpCircle), label: 'Support' });
  }
  if (feats.includes('settings') || hasAgencyFullAccess) settingsChildren.push({ key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' });

  if (settingsChildren.length > 0) {
    menuItems.push({
      key: 'settings',
      label: 'SETTINGS',
      icon: getIcon(Settings),
      children: settingsChildren,
    });
  }

  const flattenItems = (items) => items.flatMap((item) => item.children ? flattenItems(item.children) : item);

  const getSelectedKeys = () => {
    const flatItems = flattenItems(menuItems);
    const match = flatItems
      .filter((item) => item.key.startsWith('/'))
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return [match?.key || (role === 'agency_super_admin' ? '/agency/admin-overview' : '/agency/overview')];
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      brandInitials={dynamicAgencyInitials}
      brandLogo={user?.logo}
      brandLogoDark={user?.logoDark}
      brandTitle={dynamicAgencyName}
      brandSubtitle={user?.roleName || "Agency Portal"}
      accent="var(--accent-primary)"
      accentSoft="rgba(59, 130, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={getSelectedKeys()}
      onNavigate={navigate}
      partner={{
        initials: getInitials(user?.name) || 'AP',
        avatar: user?.avatar,
        label: user?.roleName || 'Agency Success',
        name: user?.name || 'Alpha Partners',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Partner Support Desk',
        phone: user?.phone,
        email: user?.email,
      }}
    />
  );
};

export default AgencySidebar;