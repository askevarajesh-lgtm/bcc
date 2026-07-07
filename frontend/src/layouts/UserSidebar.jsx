import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, LayoutDashboard, Settings, FileText, Palette, GitMerge, 
  Target, Search, BarChart2, Globe, LineChart, MessageCircle, TrendingUp
} from 'lucide-react';
import PortalSidebar from './PortalSidebar';
import { useAuth } from '../contexts/AuthContext';

const UserSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const permissions = user?.permissions || {};

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  let menuItems = [
    { key: '/user/dashboard', icon: getIcon(LayoutDashboard), label: 'Dashboard' },
    { key: '/user/tasks', icon: getIcon(CheckSquare), label: 'Tasks' },
  ];

  const hasPerm = (key) => permissions[key]?.Read;

  if (hasPerm('Workspace-Strategy')) menuItems.push({ key: '/user/workspace/strategy', icon: getIcon(Target), label: 'Strategy' });
  if (hasPerm('Workspace-SEO / AEO / GEO')) menuItems.push({ key: '/user/workspace/seo', icon: getIcon(Search), label: 'SEO' });
  if (hasPerm('Workspace-Content')) menuItems.push({ key: '/user/workspace/content', icon: getIcon(FileText), label: 'Content' });
  if (hasPerm('Workspace-AI Studio')) menuItems.push({ key: '/user/workspace/aistudio', icon: getIcon(Palette), label: 'AI Studio' });
  if (hasPerm('Workspace-Social Media')) menuItems.push({ key: '/user/workspace/social', icon: getIcon(GitMerge), label: 'Social Media' });
  if (hasPerm('Workspace-Performance Ads')) menuItems.push({ key: '/user/workspace/ads', icon: getIcon(BarChart2), label: 'Performance Ads' });
  if (hasPerm('Workspace-CRM & Leads')) menuItems.push({ key: '/user/workspace/crm', icon: getIcon(LineChart), label: 'CRM & Leads' });
  if (hasPerm('Workspace-Websites')) menuItems.push({ key: '/user/workspace/website', icon: getIcon(Globe), label: 'Websites' });

  if (hasPerm('Intelligence-Analytics & Attribution')) menuItems.push({ key: '/user/intelligence/analytics', icon: getIcon(TrendingUp), label: 'Analytics' });
  if (hasPerm('Intelligence-ChatGPT')) menuItems.push({ key: '/user/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'ChatGPT' });
  if (hasPerm('Intelligence-Canva')) menuItems.push({ key: '/user/intelligence/canva', icon: getIcon(Palette), label: 'Canva' });

  menuItems.push({ key: '/user/settings', icon: getIcon(Settings), label: 'Settings' });

  const getSelectedKey = () => {
    return menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/user/dashboard';
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      width={260}
      brandInitials="U"
      brandTitle={user?.companyName || "Employee Panel"}
      brandSubtitle={user?.roleName || "M1 Platform"}
      accent="#8b5cf6"
      accentSoft="rgba(139, 92, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={[getSelectedKey()]}
      onNavigate={navigate}
      partner={{
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : 'U',
        label: user?.roleName || 'Employee',
        name: user?.name || 'User',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Workspace',
      }}
    />
  );
};

export default UserSidebar;
