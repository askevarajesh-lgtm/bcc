import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart2,
  Bot,
  Briefcase,
  Calendar,
  CheckSquare,
  CreditCard,
  DollarSign,
  FileText,
  GitMerge,
  Globe,
  LayoutDashboard,
  Library,
  LineChart,
  MessageCircle,
  Monitor,
  Palette,
  PieChart,
  Search,
  Settings as SettingsIcon,
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
import api from '../services/api';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  
  const [slaCount, setSlaCount] = React.useState(0);
  const [accountsCount, setAccountsCount] = React.useState(0);
  const [agenciesCount, setAgenciesCount] = React.useState(0);

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

    const fetchAccountsCount = async () => {
      try {
        const res = await api.get('/brands', { params: { limit: 1 } });
        if (res && res.data) {
          const count = res.data.count ?? res.data.pagination?.total ?? res.data.data?.length ?? 0;
          setAccountsCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch accounts count for sidebar', error);
      }
    };

    const fetchAgenciesCount = async () => {
      try {
        const res = await api.get('/agencies', { params: { limit: 1 } });
        if (res && res.data) {
          const count = res.data.count ?? res.data.pagination?.total ?? res.data.data?.length ?? 0;
          setAgenciesCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch agencies count for sidebar', error);
      }
    };

    fetchSlaCount();
    fetchAccountsCount();
    fetchAgenciesCount();
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

  const menuItems = [
    {
      key: '/dashboard',
      icon: getIcon(LayoutDashboard),
      label: 'Command Center',
    },
    {
      key: 'clients',
      label: collapsed ? 'CLI' : 'CLIENTS',
      children: [
        ...(['brand_super_admin', 'brand_manager'].includes(role) ? [] : [
          { key: '/clients/accounts', icon: getIcon(Users), label: getLabel('Accounts', agenciesCount.toString()) },
        ]),
        ...(['commander_admin', 'agency_super_admin', 'agency_manager'].includes(role) ? [
          { key: '/clients/sla', icon: getIcon(Shield), label: getLabel('SLA & Success', slaCount > 0 ? slaCount.toString() : null, 'danger') }
        ] : []),
        { key: '/clients/portal', icon: getIcon(Monitor), label: getLabel(role === 'commander_admin' ? 'Direct Brand' : 'Brands', accountsCount.toString()) },
      ],
    },
    {
      key: 'workspace',
      label: collapsed ? 'WRK' : 'WORKSPACE',
      children: [
        { key: '/workspace/strategy', icon: getIcon(Target), label: 'Strategy' },
        { key: '/workspace/seo', icon: getIcon(Search), label: 'SEO / AEO / GEO' },
        { key: '/workspace/content', icon: getIcon(FileText), label: 'Content' },
        { key: '/workspace/aistudio', icon: getIcon(Palette), label: 'AI Studio' },
        { key: '/workspace/social', icon: getIcon(GitMerge), label: 'Social Media' },
        { key: '/workspace/ads', icon: getIcon(BarChart2), label: 'Performance Ads' },
        { key: '/workspace/crm', icon: getIcon(LineChart), label: getLabel('CRM & Leads', '142') },
        // { key: '/workspace/automation', icon: getIcon(Zap), label: 'Automation' },
        ...(role === 'commander_admin' ? [] : [
          { key: '/workspace/proposals', icon: getIcon(FileText), label: 'Proposals' },
          { key: '/workspace/invoices', icon: getIcon(DollarSign), label: 'Invoices' },
          { key: '/workspace/projects', icon: getIcon(Library), label: 'Projects' },
        ]),
        { key: '/workspace/tasks', icon: getIcon(CheckSquare), label: 'Task Management' },
        { key: '/workspace/website', icon: getIcon(Globe), label: 'Websites' },
      ],
    },
    {
      key: 'intelligence',
      label: collapsed ? 'INT' : 'INTELLIGENCE',
      children: [
        { key: '/intelligence/analytics', icon: getIcon(TrendingUp), label: 'Analytics & Attribution' },
        { key: '/intelligence/mos', icon: getIcon(Activity), label: getLabel('MOS Score', '68', 'warning') },
        // { key: '/intelligence/copilot', icon: getIcon(MessageCircle), label: 'AI Co-Pilot' },
        { key: '/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'ChatGPT' },
        { key: '/intelligence/canva', icon: getIcon(Palette), label: 'Canva' },
        { key: '/intelligence/agents', icon: getIcon(Bot), label: getLabel('AI Agent', 'New', 'success') },
        { key: '/intelligence/benchmarks', icon: getIcon(Award), label: 'Benchmarks' },
        { key: '/intelligence/reporting', icon: getIcon(FileText), label: 'Reports' },
        { key: '/intelligence/seo', icon: getIcon(Search), label: 'SEO Intelligence' },
      ],
    },
    ...(['agency_super_admin', 'agency_manager', 'client', 'agency_client', 'brand_super_admin', 'brand_manager'].includes(role) ? [{
      key: '/support',
      icon: getIcon(HelpCircle),
      label: 'Support'
    }] : []),
    {
      key: 'ops',
      label: collapsed ? 'OPS' : 'AGENCY OPS',
      children: [
        { key: '/ops/team', icon: getIcon(Users), label: getLabel('People', '5') },
        { key: '/ops/time', icon: getIcon(Calendar), label: 'Time Tracking' },
        { key: '/ops/resources', icon: getIcon(Calendar), label: 'Resources' },
        ...(role === 'commander_admin' ? [] : [
          { key: '/ops/finance', icon: getIcon(CreditCard), label: 'Finance' },
          { key: '/ops/profitability', icon: getIcon(DollarSign), label: 'Profitability' },
        ]),
        { key: '/ops/salespipeline', icon: getIcon(Briefcase), label: getLabel('Sales Pipeline', '8') },
        { key: '/ops/businessintel', icon: getIcon(PieChart), label: 'Business Intel' },
        { key: '/ops/meetings', icon: getIcon(Calendar), label: role === 'commander_admin' ? 'Global Meetings' : 'Meetings' },
        { key: '/ops/calendar', icon: getIcon(Calendar), label: role === 'commander_admin' ? 'Global Calendar' : 'Calendar' },
        { key: '/ops/deliverables', icon: getIcon(FileText), label: role === 'commander_admin' ? 'Global Deliverables' : 'Deliverables' },
      ],
    },
    {
      key: 'settings',
      label: collapsed ? 'SET' : 'SETTINGS',
      children: [
        { key: '/settings/company', icon: getIcon(SettingsIcon), label: 'Settings' },
        ...(role === 'commander_admin' ? [] : [
          { key: '/workspace/master-items', icon: getIcon(Store), label: 'Master Item' },
        ]),
      ],
    },
  ];

  const flattenItems = (items) => items.flatMap((item) => item.children ? flattenItems(item.children) : item);

  const getSelectedKeys = () => {
    const flatItems = flattenItems(menuItems);
    const match = flatItems
      .filter((item) => item.key.startsWith('/'))
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return [match?.key || '/dashboard'];
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      brandInitials="M1"
      brandLogo={user?.logo}
      brandTitle="M1"
      brandSubtitle="Agency Growth OS"
      accent="#3b82f6"
      accentSoft="rgba(59, 130, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={['clients', 'workspace', 'intelligence', 'ops', 'settings']}
      onNavigate={navigate}
      partner={{
        initials: getInitials(user?.name),
        label: user?.roleName || 'Role Not Assigned',
        name: user?.name || 'Unknown User',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Workspace',
      }}
    />
  );
};

export default Sidebar;
