import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Globe, LayoutDashboard, Users, Zap, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PortalSidebar from './PortalSidebar';

const SuperAdminSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getIcon = React.useCallback((IconCmp) => <IconCmp size={18} strokeWidth={2} />, []);

  const menuItems = React.useMemo(() => [
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
      label: 'Subscriptions & Plans',
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
    {
      key: '/superadmin/settings',
      icon: getIcon(Settings),
      label: 'Profile',
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
  ], [getIcon]);

  const flattenItems = React.useCallback((items) => items.flatMap((item) => item.children ? flattenItems(item.children) : item), []);

  const selectedKeys = React.useMemo(() => {
    const flatItems = flattenItems(menuItems);
    const match = flatItems
      .filter((item) => item.key && item.key.startsWith('/'))
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return [match?.key || '/superadmin/dashboard'];
  }, [menuItems, location.pathname, flattenItems]);

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      brandInitials="SA"
      brandLogo={user?.logo}
      brandLogoDark={user?.logoDark}
      brandTitle="M1 Platform"
      accent="var(--accent-primary)"
      accentSoft="rgba(124, 58, 237, 0.12)"
      menuItems={menuItems}
      selectedKeys={selectedKeys}
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
