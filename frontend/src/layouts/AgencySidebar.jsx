import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckSquare,
  CreditCard,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  PenTool,
  Search,
  Settings,
  Share2,
  Shield,
  Store,
  Target,
  TrendingUp,
  Users,
  Zap,
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

  const dynamicAgencyName = user?.agencyName || user?.companyName || 'BCC Martech';
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

  let menuItems = [];

  if (role === 'agency_super_admin') {
    menuItems = [
      { key: '/agency/admin-overview', icon: getIcon(LayoutDashboard), label: 'Dashboard' },
      { key: '/agency/performance', icon: getIcon(TrendingUp), label: 'Performance' },
      { key: '/agency/billing', icon: getIcon(CreditCard), label: 'Billing' },
      { key: '/agency/reports', icon: getIcon(FileText), label: 'Reports' },
      { key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' },
      { key: '/agency/users', icon: getIcon(Shield), label: 'User Management' },
      { key: '/agency/sla', icon: getIcon(Activity), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') },
      { key: '/agency/support', icon: getIcon(HelpCircle), label: 'Support' },
    ];
  } else {
    const feats = features || [];

    if (feats.includes('dashboard') || feats.length === 0) {
      menuItems.push({ key: '/agency/overview', icon: getIcon(LayoutDashboard), label: 'Command Center' });
    }

    if (feats.includes('clients') || feats.length === 0) {
      menuItems.push({
        key: 'clients-group',
        type: 'group',
        label: 'CLIENTS',
        children: [
          { key: '/agency/clients', icon: getIcon(Users), label: 'Accounts' },
          ...(['agency_super_admin', 'agency_manager'].includes(role) ? [
            { key: '/agency/sla', icon: getIcon(Activity), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') }
          ] : []),
        ],
      });
    }

    const workspaceChildren = [];
    if (feats.includes('settings') || feats.length === 0) workspaceChildren.push({ key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' });
    if (feats.includes('strategy') || feats.length === 0) workspaceChildren.push({ key: '/agency/strategy', icon: getIcon(Target), label: 'Strategy' });
    if (feats.includes('seo') || feats.length === 0) workspaceChildren.push({ key: '/agency/seo', icon: getIcon(Search), label: 'SEO / AEO / GEO' });
    if (feats.includes('content') || feats.length === 0) workspaceChildren.push({ key: '/agency/content', icon: getIcon(PenTool), label: 'Content' });
    if (feats.includes('aistudio') || feats.length === 0) workspaceChildren.push({ key: '/agency/ai-studio', icon: getIcon(Zap), label: 'AI Studio' });
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
        children: workspaceChildren,
      });
    }

    if (['agency_super_admin', 'agency_manager', 'agency_client'].includes(role)) {
      menuItems.push({ key: '/agency/support', icon: getIcon(HelpCircle), label: 'Support' });
    }
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
      brandTitle={dynamicAgencyName}
      brandSubtitle={user?.roleName || "Agency Portal"}
      accent="#3b82f6"
      accentSoft="rgba(59, 130, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={getSelectedKeys()}
      onNavigate={navigate}
      partner={{
        initials: getInitials(user?.name) || 'AP',
        label: user?.roleName || 'Agency Success',
        name: user?.name || 'Alpha Partners',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Partner Support Desk',
      }}
    />
  );
};

export default AgencySidebar;
