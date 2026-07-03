import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart2,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  CreditCard,
  DollarSign,
  FileText,
  GitMerge,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Library,
  LineChart,
  MessageCircle,
  Palette,
  PieChart,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import PortalSidebar from './PortalSidebar';
import { slaApi } from '../api/slaApi';

const ClientSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const { features } = useFeatures();
  
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
  const { hasFeature } = useFeatures();

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

  const dynamicBrandName = user?.brandName || user?.companyName || 'Prestige Estates';
  const dynamicBrandInitials = dynamicBrandName.substring(0, 2).toUpperCase();

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  const getBadge = (text, type = 'neutral') => (
    <span className={`sidebar-menu-badge sidebar-menu-badge--${type}`}>{text}</span>
  );

  const getLabel = (text, badgeText, badgeType) => {
    if (!badgeText) return text;
    return (
      <div className="sidebar-menu-label">
        <span>{text}</span>
        {getBadge(badgeText, badgeType)}
      </div>
    );
  };

  let allMenuItems = [
    {
      key: role === 'brand_super_admin' ? '/client/admin-dashboard' : role === 'brand_manager' ? '/client/manager-dashboard' : '/client/dashboard',
      icon: getIcon(LayoutDashboard),
      label: role === 'agency_client' ? 'Dashboard' : 'Command Center',
      ...(['brand_super_admin', 'brand_manager'].includes(role) ? {} : { featureId: 'dashboard' }),
    },
  ];

  if (role === 'brand_super_admin') {
    allMenuItems.push(
      {
        key: 'clients',
        label: collapsed ? 'CLI' : 'CLIENTS',
        children: [
          { key: '/client/users', icon: getIcon(Users), label: 'Users' },
          { key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing' },
        ],
      },
      {
        key: 'calendar-group',
        label: collapsed ? 'CAL' : 'CALENDAR',
        children: [
          { key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' },
          { key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' },
        ],
      },
      {
        key: 'projects-group',
        label: collapsed ? 'PRJ' : 'PROJECTS',
        children: [
          { key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' },
        ],
      },
      {
        key: 'intelligence',
        label: collapsed ? 'INT' : 'INTELLIGENCE',
        children: [
          { key: '/client/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' },
        ],
      },
      {
        key: 'settings',
        label: collapsed ? 'SET' : 'SETTINGS',
        children: [
          { key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' },
        ],
      },
      {
        key: 'support-group',
        label: collapsed ? 'SUP' : 'SUPPORT',
        children: [
          { key: '/client/support', icon: getIcon(HelpCircle), label: 'Support', featureId: 'support' },
        ],
      }
    );
  } else if (role === 'brand_manager') {
    allMenuItems.push(
      {
        key: 'clients',
        label: collapsed ? 'CLI' : 'CLIENTS',
        children: [
          { key: '/client/support', icon: getIcon(HelpCircle), label: 'Support', featureId: 'support' },
        ],
      },
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
          { key: '/client/workspace/crm', icon: getIcon(LineChart), label: getLabel('CRM & Leads', '142') },
          { key: '/client/workspace/proposals', icon: getIcon(FileText), label: 'Proposals' },
          { key: '/client/workspace/invoices', icon: getIcon(DollarSign), label: 'Invoices' },
          { key: '/client/workspace/projects', icon: getIcon(Library), label: 'Projects' },
          { key: '/client/workspace/automation', icon: getIcon(Zap), label: 'Automation' },
          { key: '/client/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' },
          { key: '/client/workspace/website', icon: getIcon(Globe), label: 'Websites' },
          { key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' },
          { key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' },
          { key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' },
        ],
      },
      {
        key: 'intelligence',
        label: collapsed ? 'INT' : 'INTELLIGENCE',
        children: [
          { key: '/client/intelligence/analytics', icon: getIcon(TrendingUp), label: 'Analytics & Attribution' },
          { key: '/client/intelligence/mos', icon: getIcon(Activity), label: getLabel('MOS Score', '68', 'warning') },
          { key: '/client/intelligence/copilot', icon: getIcon(MessageCircle), label: 'AI Co-Pilot' },
          { key: '/client/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'ChatGPT' },
          { key: '/client/intelligence/canva', icon: getIcon(Palette), label: 'Canva' },
          { key: '/client/intelligence/agents', icon: getIcon(Bot), label: getLabel('AI Agent', 'New', 'success') },
          { key: '/client/intelligence/benchmarks', icon: getIcon(Award), label: 'Benchmarks' },
          { key: '/client/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' },
        ],
      },
      {
        key: 'ops',
        label: collapsed ? 'OPS' : 'AGENCY OPS',
        children: [
          { key: '/client/ops/team', icon: getIcon(Users), label: getLabel('People', '5') },
          { key: '/client/ops/time', icon: getIcon(Calendar), label: 'Time Tracking' },
          { key: '/client/ops/resources', icon: getIcon(Calendar), label: 'Resources' },
          { key: '/client/ops/finance', icon: getIcon(CreditCard), label: 'Finance' },
          { key: '/client/ops/profitability', icon: getIcon(DollarSign), label: 'Profitability' },
          { key: '/client/ops/salespipeline', icon: getIcon(Briefcase), label: getLabel('Sales Pipeline', '8') },
          { key: '/client/ops/businessintel', icon: getIcon(PieChart), label: 'Business Intel' },
        ],
      },
      {
        key: 'settings',
        label: collapsed ? 'SET' : 'SETTINGS',
        children: [
          { key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' },
          { key: '/client/workspace/master-items', icon: getIcon(Store), label: 'Master Item' },
        ],
      }
    );
  } else if (role === 'agency_client') {
    allMenuItems.push(
      { key: '/client/performance', icon: getIcon(BarChart2), label: 'Marketing Performance', featureId: 'performance' },
      { key: '/client/leads', icon: getIcon(Users), label: 'CRM', featureId: 'leads' },
      { key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' },
      { key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' },
      { key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' },
      { key: '/client/intelligence/copilot', icon: getIcon(Sparkles), label: 'AI Executive' },
      { key: '/client/settings/marketplace', icon: getIcon(ShoppingCart), label: 'Marketplace' },
      { key: '/client/reports', icon: getIcon(FileText), label: 'Reports' },
      { key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing', featureId: 'billing' },
      { key: '/client/support', icon: getIcon(HelpCircle), label: 'Support', featureId: 'support' },
      { key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' }
    );
  } else {
    allMenuItems.push(
      { key: '/client/performance', icon: getIcon(Target), label: 'Marketing Performance', featureId: 'performance' },
      { key: '/client/leads', icon: getIcon(Users), label: 'CRM', featureId: 'leads' },
      { key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' },
      { key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' },
      { key: '/client/website', icon: getIcon(Globe), label: 'Website', featureId: 'website' },
      { key: '/client/store', icon: getIcon(ShoppingCart), label: 'Store', featureId: 'store' },
      { key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing', featureId: 'billing' },
      { key: '/client/reports', icon: getIcon(FileText), label: 'Reports' },
      { key: '/client/support', icon: getIcon(HelpCircle), label: 'Support', featureId: 'support' },
      { key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' }
    );
  }

  const filterMenuItems = (items) => items
    .map((item) => {
      if (item.children) {
        const children = filterMenuItems(item.children);
        return children.length ? { ...item, children } : null;
      }
      return !item.featureId || hasFeature(item.featureId) ? item : null;
    })
    .filter(Boolean);

  const menuItems = filterMenuItems(allMenuItems);

  const getSelectedKeys = () => {
    let match = menuItems.find((item) => !item.children && location.pathname.startsWith(item.key));
    if (!match) {
      for (const group of menuItems) {
        if (group.children) {
          match = group.children.find((child) => location.pathname.startsWith(child.key));
          if (match) break;
        }
      }
    }
    return match ? [match.key] : [role === 'brand_super_admin' ? '/client/admin-dashboard' : role === 'brand_manager' ? '/client/manager-dashboard' : '/client/dashboard'];
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      brandInitials={dynamicBrandInitials}
      brandLogo={user?.logo}
      brandTitle={dynamicBrandName}
      brandSubtitle={user?.roleName || "Executive Portal"}
      accent="#10b981"
      accentSoft="rgba(16, 185, 129, 0.12)"
      menuItems={menuItems}
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={['clients', 'workspace', 'intelligence', 'ops', 'settings']}
      onNavigate={navigate}
      partner={{
        initials: getInitials(user?.name) || 'AR',
        label: user?.roleName || 'Your Growth Partner',
        name: user?.name || 'Arjun Raj',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Senior Brand Strategist',
      }}
    />
  );
};

export default ClientSidebar;
