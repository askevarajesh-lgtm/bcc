import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Globe, LayoutDashboard, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PortalSidebar from './PortalSidebar';

const SuperAdminSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  const menuItems = [
    {
      key: '/superadmin/dashboard',
      icon: getIcon(LayoutDashboard),
      label: 'Platform Overview',
    },
    {
      key: '/superadmin/companies',
      icon: getIcon(Building2),
      label: 'Companies / Agencies',
    },
    {
      key: '/superadmin/subscriptions',
      icon: getIcon(CreditCard),
      label: 'Subscriptions & Billing',
    },
    {
      key: '/superadmin/integrations',
      icon: getIcon(Zap),
      label: 'Global Integrations',
    },
    {
      key: '/superadmin/admins',
      icon: getIcon(Users),
      label: 'User Management',
    },
    // {
    //   key: 'platform-views',
    //   icon: getIcon(Globe),
    //   label: 'Platform Views',
    //   children: [
    //     { key: '/dashboard', label: 'Admin Portal' },
    //     { key: '/agency/overview', label: 'Agency Portal' },
    //     { key: '/client/dashboard', label: 'Client Portal' },
    //   ],
    // },
  ];

  const flattenItems = (items) => items.flatMap((item) => item.children ? flattenItems(item.children) : item);

  const getSelectedKeys = () => {
    const flatItems = flattenItems(menuItems);
    const match = flatItems
      .filter((item) => item.key.startsWith('/'))
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return [match?.key || '/superadmin/dashboard'];
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      brandInitials="SA"
      brandLogo={user?.logo}
      brandTitle="M1 Platform"
      accent="#7c3aed"
      accentSoft="rgba(124, 58, 237, 0.12)"
      menuItems={menuItems}
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={['platform-views']}
      onNavigate={navigate}
      partner={{
        initials: 'OS',
        label: 'System Health',
        name: 'Ops Studio',
        title: '99.98% uptime',
      }}
    />
  );
};

export default SuperAdminSidebar;
