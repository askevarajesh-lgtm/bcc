import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, Settings, Calendar } from 'lucide-react';
import PortalSidebar from './PortalSidebar';

const UserSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  const menuItems = [
    { key: '/user/dashboard', icon: getIcon(LayoutDashboard), label: 'Dashboard' },
    { key: '/user/tasks', icon: getIcon(CheckSquare), label: 'Tasks' },
    { key: '/user/meetings', icon: getIcon(Calendar), label: 'Meetings' },
    { key: '/user/settings', icon: getIcon(Settings), label: 'Settings' },
  ];

  const getSelectedKey = () => {
    return menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/user/dashboard';
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      width={260}
      brandInitials="U"
      brandTitle="User Panel"
      brandSubtitle="M1 Platform"
      accent="#8b5cf6"
      accentSoft="rgba(139, 92, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={[getSelectedKey()]}
      onNavigate={navigate}
      partner={{
        initials: 'HD',
        label: 'Need Help?',
        name: 'Help Desk',
        title: 'Platform Support',
      }}
    />
  );
};

export default UserSidebar;
