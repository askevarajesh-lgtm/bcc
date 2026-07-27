import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart2,
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Cpu,
  CreditCard,
  DollarSign,
  FileText,
  GitMerge,
  Globe,
  Globe2,
  Hash,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Library,
  LineChart,
  MessageCircle,
  Palette,
  PieChart,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Swords,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import PortalSidebar from './PortalSidebar';
import { sidebarApi } from '../api/sidebarApi';
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
  
  const hasFeature = (featureName) => {
    return user && user.features && user.features.includes(featureName);
  };
  
  const [peopleCount, setPeopleCount] = React.useState('...');
  const [leadsCount, setLeadsCount] = React.useState('...');
  const [pipelineCount, setPipelineCount] = React.useState('...');
  const [mosScore, setMosScore] = React.useState('...');

  React.useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const res = await sidebarApi.getCounts();
        if (res?.data?.success) {
          const { people, leads, pipeline, mosScore: mos } = res.data.data;
          setPeopleCount(people.toString());
          setLeadsCount(leads.toString());
          setPipelineCount(pipeline.toString());
          setMosScore(mos.toString());
        }
      } catch (error) {
        console.error('Failed to fetch dynamic sidebar counts', error);
      }
    };
    fetchSidebarCounts();
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
    },
  ];

  if (role === 'brand_super_admin') {
    allMenuItems.push({
      key: 'clients',
      label: collapsed ? 'CLI' : 'CLIENTS',
      children: [
        { key: '/client/users', icon: getIcon(Users), label: 'Users' },
        { key: '/client/clients/sla', icon: getIcon(Shield), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') },
      ],
    });
  } else if (role === 'brand_manager') {
    allMenuItems.push({
      key: 'clients',
      label: collapsed ? 'CLI' : 'CLIENTS',
      children: [
        { key: '/client/clients/sla', icon: getIcon(Shield), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') },
      ],
    });
  }

  const workspaceChildren = [];

  const buildMarketplaceMenuItem = () => ({
    key: 'client-marketplace',
    icon: getIcon(ShoppingCart),
    label: 'Marketplace',
    children: [
      { key: '/client/marketplace', icon: getIcon(ShoppingCart), label: 'Overview' },
      {
        key: 'client-marketplace-seo',
        icon: getIcon(Search),
        label: 'SEO',
        children: [
          { key: '/client/marketplace/seo/dashboard', icon: getIcon(LayoutGrid), label: 'Dashboard' },
          { key: '/client/marketplace/seo/audit', icon: getIcon(ClipboardCheck), label: 'Audit' },
          { key: '/client/marketplace/seo/keywords', icon: getIcon(Hash), label: 'Keywords' },
          { key: '/client/marketplace/seo/competitors', icon: getIcon(Swords), label: 'Competitors' },
          { key: '/client/marketplace/seo/content-ai', icon: getIcon(Sparkles), label: 'Content AI' },
          { key: '/client/marketplace/seo/technical-seo', icon: getIcon(Cpu), label: 'Technical SEO' },
          { key: '/client/marketplace/seo/website-builder', icon: getIcon(LayoutTemplate), label: 'Website Builder' },
          { key: '/client/marketplace/seo/store-seo', icon: getIcon(ShoppingBag), label: 'Store SEO' },
          { key: '/client/marketplace/seo/blog-seo', icon: getIcon(BookOpen), label: 'Blog SEO' },
          { key: '/client/marketplace/seo/aeo', icon: getIcon(MessageCircle), label: 'AEO' },
          { key: '/client/marketplace/seo/geo', icon: getIcon(Globe2), label: 'GEO' },
          { key: '/client/marketplace/seo/reports', icon: getIcon(FileText), label: 'Reports' },
          { key: '/client/marketplace/seo/automation', icon: getIcon(Zap), label: 'Automation' },
          { key: '/client/marketplace/seo/monitoring', icon: getIcon(Activity), label: 'Monitoring' },
          { key: '/client/marketplace/seo/settings', icon: getIcon(SettingsIcon), label: 'Settings' },
        ],
      },
    ],
  });

  if (role === 'brand_super_admin') {
    // No workspace modules for brand_super_admin
  } else if (role === 'brand_manager') {
    workspaceChildren.push({ key: '/client/workspace/strategy', icon: getIcon(GitMerge), label: 'Strategy', featureId: 'strategy' });
    workspaceChildren.push({ key: '/client/workspace/aistudio', icon: getIcon(Bot), label: 'Ai Studio', featureId: 'aistudio' });
    workspaceChildren.push({ key: '/client/workspace/social', icon: getIcon(MessageCircle), label: 'Social Media', featureId: 'social' });
    workspaceChildren.push({ key: '/client/workspace/ads', icon: getIcon(Target), label: 'Performance Ads', featureId: 'ads' });
    workspaceChildren.push({ key: '/client/workspace/crm', icon: getIcon(LineChart), label: getLabel('CRM & Leads', leadsCount), featureId: 'crm' });
    workspaceChildren.push({ key: '/client/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' });
    workspaceChildren.push({ key: '/client/workspace/website', icon: getIcon(Globe), label: 'Websites', featureId: 'website' });
    workspaceChildren.push(buildMarketplaceMenuItem());
  } else if (role === 'agency_client') {
    workspaceChildren.push({ key: '/client/workspace/strategy', icon: getIcon(GitMerge), label: 'Strategy', featureId: 'strategy' });
    workspaceChildren.push({ key: '/client/workspace/aistudio', icon: getIcon(Bot), label: 'Ai Studio', featureId: 'aistudio' });
    workspaceChildren.push({ key: '/client/workspace/social', icon: getIcon(MessageCircle), label: 'Social Media', featureId: 'social' });
    workspaceChildren.push({ key: '/client/workspace/ads', icon: getIcon(Target), label: 'Performance Ads', featureId: 'ads' });
    workspaceChildren.push({ key: '/client/leads', icon: getIcon(Users), label: 'CRM & Leads', featureId: 'crm' });
    workspaceChildren.push({ key: '/client/website', icon: getIcon(Globe), label: 'Websites', featureId: 'website' });
    workspaceChildren.push(buildMarketplaceMenuItem());
  } else {
    workspaceChildren.push({ key: '/client/leads', icon: getIcon(Users), label: 'CRM & Leads', featureId: 'crm' });
    workspaceChildren.push({ key: '/client/website', icon: getIcon(Globe), label: 'Websites', featureId: 'website' });
    workspaceChildren.push(buildMarketplaceMenuItem());
  }

  if (workspaceChildren.length > 0) {
    allMenuItems.push({
      key: 'workspace',
      label: collapsed ? 'WRK' : 'WORKSPACE',
      children: workspaceChildren,
    });
  }

  const intelligenceChildren = [];
  if (role === 'brand_super_admin') {
    intelligenceChildren.push({ key: '/client/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' });
  } else if (role === 'brand_manager') {
    intelligenceChildren.push({ key: '/client/performance', icon: getIcon(BarChart2), label: 'Marketing Performance', featureId: 'analytics' });
    intelligenceChildren.push({ key: '/client/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'Chatgpt', featureId: 'chatgpt' });
    intelligenceChildren.push({ key: '/client/intelligence/canva', icon: getIcon(Palette), label: 'Canva', featureId: 'canva' });
    intelligenceChildren.push({ key: '/client/intelligence/benchmarks', icon: getIcon(Activity), label: 'Benchmark', featureId: 'benchmark' });
    intelligenceChildren.push({ key: '/client/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' });
    intelligenceChildren.push({ key: '/client/intelligence/seo', icon: getIcon(Search), label: 'Seo Intelligence', featureId: 'seo' });
  } else if (role === 'agency_client') {
    // intelligenceChildren.push({ key: '/client/performance', icon: getIcon(BarChart2), label: 'Marketing Performance' });
    intelligenceChildren.push({ key: '/client/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'Chatgpt', featureId: 'chatgpt' });
    intelligenceChildren.push({ key: '/client/intelligence/canva', icon: getIcon(Palette), label: 'Canva', featureId: 'canva' });
    intelligenceChildren.push({ key: '/client/intelligence/benchmarks', icon: getIcon(Activity), label: 'Benchmark', featureId: 'benchmark' });
    // intelligenceChildren.push({ key: '/client/reports', icon: getIcon(FileText), label: 'Reports' });
    intelligenceChildren.push({ key: '/client/intelligence/seo', icon: getIcon(Search), label: 'Seo Intelligence', featureId: 'seo' });
  } else {
    intelligenceChildren.push({ key: '/client/performance', icon: getIcon(BarChart2), label: 'Marketing Performance' });
    intelligenceChildren.push({ key: '/client/reports', icon: getIcon(FileText), label: 'Reports' });
    intelligenceChildren.push({ key: '/client/intelligence/seo', icon: getIcon(Search), label: 'Seo Intelligence', featureId: 'seo' });
  }

  if (intelligenceChildren.length > 0) {
    allMenuItems.push({
      key: 'intelligence',
      label: collapsed ? 'INT' : 'INTELLIGENCE',
      children: intelligenceChildren,
    });
  }

  const opsChildren = [];
  if (role === 'brand_super_admin') {
    // opsChildren.push({ key: '/client/ops/team', icon: getIcon(Users), label: getLabel('People', peopleCount) });
    opsChildren.push({ key: '/client/ops/time', icon: getIcon(Calendar), label: 'Time Tracking' });
    opsChildren.push({ key: '/client/ops/resources', icon: getIcon(Calendar), label: 'Resources' });
    opsChildren.push({ key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' });
    opsChildren.push({ key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' });
  } else if (role === 'brand_manager') {
    // opsChildren.push({ key: '/client/ops/team', icon: getIcon(Users), label: getLabel('People', peopleCount) });
    opsChildren.push({ key: '/client/ops/time', icon: getIcon(Calendar), label: 'Time Tracking' });
    opsChildren.push({ key: '/client/ops/resources', icon: getIcon(Calendar), label: 'Resources' });
    opsChildren.push({ key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' });
    opsChildren.push({ key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' });
  } else if (role === 'agency_client') {
    opsChildren.push({ key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' });
    opsChildren.push({ key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' });
    opsChildren.push({ key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' });
  } else {
    opsChildren.push({ key: '/client/meetings', icon: getIcon(Calendar), label: 'Meetings' });
    opsChildren.push({ key: '/client/calendar', icon: getIcon(Calendar), label: 'Calendar' });
    opsChildren.push({ key: '/client/deliverables', icon: getIcon(FileText), label: 'Deliverables' });
  }

  if (opsChildren.length > 0) {
    allMenuItems.push({
      key: 'ops',
      label: collapsed ? 'OPS' : 'AGENCY OPS',
      children: opsChildren,
    });
  }

  const settingsChildren = [];
  if (role === 'brand_super_admin') {
    settingsChildren.push({ key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing' });
    settingsChildren.push({ key: '/client/support', icon: getIcon(HelpCircle), label: 'Support' });
    settingsChildren.push({ key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' });
  } else if (role === 'brand_manager') {
    settingsChildren.push({ key: '/client/support', icon: getIcon(HelpCircle), label: 'Support' });
    settingsChildren.push({ key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' });
  } else if (role === 'agency_client') {
    settingsChildren.push({ key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing' });
    settingsChildren.push({ key: '/client/support', icon: getIcon(HelpCircle), label: 'Support' });
    settingsChildren.push({ key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' });
  } else {
    settingsChildren.push({ key: '/client/billing', icon: getIcon(CreditCard), label: 'Billing' });
    settingsChildren.push({ key: '/client/support', icon: getIcon(HelpCircle), label: 'Support' });
    settingsChildren.push({ key: '/client/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' });
  }

  if (settingsChildren.length > 0) {
    allMenuItems.push({
      key: 'settings',
      label: collapsed ? 'SET' : 'SETTINGS',
      children: settingsChildren,
    });
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

  const flattenMenuItems = (items) => items.flatMap((item) => (item.children ? flattenMenuItems(item.children) : item));

  const getSelectedKeys = () => {
    const flatItems = flattenMenuItems(menuItems);
    const match = flatItems
      .filter((item) => item.key.startsWith('/'))
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return [match?.key || (role === 'brand_super_admin' ? '/client/admin-dashboard' : role === 'brand_manager' ? '/client/manager-dashboard' : '/client/dashboard')];
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