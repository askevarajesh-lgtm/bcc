import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  Cpu,
  CreditCard,
  FileText,
  Globe2,
  Hash,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Library,
  Megaphone,
  MessageCircle,
  PenTool,
  PieChart,
  Search,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Swords,
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
      label: collapsed ? 'CLI' : 'CLIENTS',
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
    workspaceChildren.push({ key: '/agency/invoices', icon: getIcon(CreditCard), label: 'Invoices' });
    workspaceChildren.push({ key: '/agency/projects', icon: getIcon(Library), label: 'Projects' });
    workspaceChildren.push({ key: '/agency/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' });
    if (feats.includes('website')) workspaceChildren.push({ key: '/agency/website', icon: getIcon(LayoutDashboard), label: 'Websites' });
    workspaceChildren.push({
      key: 'agency-marketplace',
      icon: getIcon(Store),
      label: 'Marketplace',
      children: [
        { key: '/agency/marketplace', icon: getIcon(Store), label: 'Overview' },
        {
          key: 'agency-marketplace-seo',
          icon: getIcon(Search),
          label: 'SEO',
          children: [
            { key: '/agency/marketplace/seo/dashboard', icon: getIcon(LayoutGrid), label: 'Dashboard' },
            { key: '/agency/marketplace/seo/audit', icon: getIcon(ClipboardCheck), label: 'Audit' },
            { key: '/agency/marketplace/seo/keywords', icon: getIcon(Hash), label: 'Keywords' },
            { key: '/agency/marketplace/seo/competitors', icon: getIcon(Swords), label: 'Competitors' },
            { key: '/agency/marketplace/seo/content-ai', icon: getIcon(Sparkles), label: 'Content AI' },
            { key: '/agency/marketplace/seo/technical-seo', icon: getIcon(Cpu), label: 'Technical SEO' },
            { key: '/agency/marketplace/seo/website-builder', icon: getIcon(LayoutTemplate), label: 'Website Builder' },
            { key: '/agency/marketplace/seo/store-seo', icon: getIcon(ShoppingBag), label: 'Store SEO' },
            { key: '/agency/marketplace/seo/blog-seo', icon: getIcon(BookOpen), label: 'Blog SEO' },
            { key: '/agency/marketplace/seo/aeo', icon: getIcon(MessageCircle), label: 'AEO' },
            { key: '/agency/marketplace/seo/geo', icon: getIcon(Globe2), label: 'GEO' },
            { key: '/agency/marketplace/seo/reports', icon: getIcon(FileText), label: 'Reports' },
            { key: '/agency/marketplace/seo/automation', icon: getIcon(Zap), label: 'Automation' },
            { key: '/agency/marketplace/seo/monitoring', icon: getIcon(Activity), label: 'Monitoring' },
            { key: '/agency/marketplace/seo/settings', icon: getIcon(Settings), label: 'Settings' },
          ],
        },
      ],
    });
    if (feats.includes('seo')) workspaceChildren.push({ key: '/agency/seo', icon: getIcon(Search), label: 'SEO / AEO / GEO' });
  }

  if (workspaceChildren.length > 0) {
    menuItems.push({
      key: 'workspace',
      label: collapsed ? 'WRK' : 'WORKSPACE',
      children: workspaceChildren,
    });
  }

  const intelligenceChildren = [];
  if (role !== 'agency_super_admin') {
    if (feats.includes('analytics')) intelligenceChildren.push({ key: '/agency/analytics', icon: getIcon(TrendingUp), label: 'Analytics & Attribution' });
    if (feats.includes('chatgpt')) intelligenceChildren.push({ key: '/agency/chatgpt', icon: getIcon(HelpCircle), label: 'ChatGPT' });
    if (feats.includes('canva')) intelligenceChildren.push({ key: '/agency/canva', icon: getIcon(PenTool), label: 'Canva' });
    if (feats.includes('benchmark')) intelligenceChildren.push({ key: '/agency/benchmarks', icon: getIcon(Activity), label: 'Benchmark' });
  }
  
  if (role === 'agency_super_admin') {
    intelligenceChildren.push({ key: '/agency/performance', icon: getIcon(TrendingUp), label: 'Performance' });
    intelligenceChildren.push({ key: '/agency/reports', icon: getIcon(FileText), label: 'Reports' });
  }

  if (intelligenceChildren.length > 0) {
    menuItems.push({
      key: 'intelligence',
      label: collapsed ? 'INT' : 'INTELLIGENCE',
      children: intelligenceChildren,
    });
  }

  const opsChildren = [];
  opsChildren.push({ key: '/agency/time', icon: getIcon(Calendar), label: 'Time Tracking' });
  opsChildren.push({ key: '/agency/businessintel', icon: getIcon(PieChart), label: 'Business Intel' });
  opsChildren.push({ key: '/agency/meetings', icon: getIcon(Calendar), label: 'Meetings' });
  opsChildren.push({ key: '/agency/calendar', icon: getIcon(Calendar), label: 'Calendar' });
  opsChildren.push({ key: '/agency/deliverables', icon: getIcon(FileText), label: 'Deliverables' });

  if (opsChildren.length > 0) {
    menuItems.push({
      key: 'ops',
      label: collapsed ? 'OPS' : 'AGENCY OPS',
      children: opsChildren,
    });
  }

  const settingsChildren = [];
  if (feats.includes('master-items') || hasAgencyFullAccess) settingsChildren.push({ key: '/agency/master-items', icon: getIcon(Store), label: 'Master Item' });
  if (role === 'agency_super_admin') {
    settingsChildren.push({ key: '/agency/users', icon: getIcon(Shield), label: 'User Management' });
    settingsChildren.push({ key: '/agency/billing', icon: getIcon(CreditCard), label: 'Billing' });
  }
  if (['agency_super_admin', 'agency_manager', 'agency_client'].includes(role)) {
    settingsChildren.push({ key: '/agency/support', icon: getIcon(HelpCircle), label: 'Support' });
  }
  if (feats.includes('settings') || hasAgencyFullAccess) settingsChildren.push({ key: '/agency/settings', icon: getIcon(Settings), label: 'Settings' });

  if (settingsChildren.length > 0) {
    menuItems.push({
      key: 'settings',
      label: collapsed ? 'SET' : 'SETTINGS',
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