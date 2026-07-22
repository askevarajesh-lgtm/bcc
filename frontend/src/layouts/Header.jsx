import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Dropdown, Grid, Layout, Popover, List, Typography, Spin } from 'antd';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayoutContext } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { role, user, logout } = useAuth();
  const { toggleMobileMenu } = useLayoutContext();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifsVisible, setNotifsVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // In a real app we might set up an interval or websocket here
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/tasks/notifications?limit=5');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/tasks/notifications/${notification._id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      }
      setNotifsVisible(false);

      if (notification.type?.startsWith('sla_')) {
        const basePath = role.includes('brand') || role === 'client' ? '/client/sla' : '/agency/sla';
        navigate(basePath);
      } else if (notification.taskId) {
        // Handle task click
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const notificationContent = (
    <div style={{ width: 300 }}>
      {loadingNotifs ? (
        <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
      ) : (
        <List
          dataSource={notifications}
          locale={{ emptyText: "No new notifications" }}
          renderItem={(item) => (
            <List.Item 
              style={{ cursor: 'pointer', opacity: item.isRead ? 0.6 : 1, padding: '12px 0' }}
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                title={<span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>{item.title}</span>}
                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
              />
            </List.Item>
          )}
        />
      )}
      <Button type="link" block onClick={() => {
        setNotifsVisible(false);
        if (role.includes('brand') || role === 'client') navigate('/client/settings');
        else navigate('/agency/settings'); // Notifications tab is inside settings
      }}>
        View All Notifications
      </Button>
    </div>
  );

  const handleRevertImpersonation = () => {
    const origToken = localStorage.getItem('original_token');
    const origUserStr = localStorage.getItem('original_user');
    if (origToken && origUserStr) {
      localStorage.setItem('token', origToken);
      localStorage.setItem('user', origUserStr);
      
      const parsedUser = JSON.parse(origUserStr);
      localStorage.setItem('userRole', parsedUser.role);

      localStorage.removeItem('original_token');
      localStorage.removeItem('original_user');
      
      if (parsedUser.role === 'supreme_super_admin') {
        window.location.href = '/superadmin/dashboard';
      } else if (parsedUser.role === 'commander_admin') {
        window.location.href = '/dashboard';
      } else if (['agency_super_admin', 'agency_manager'].includes(parsedUser.role)) {
        window.location.href = '/agency/overview';
      } else if (['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user'].includes(parsedUser.role)) {
        window.location.href = '/client/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  const roleDefaults = {
    supreme_super_admin: { name: 'Supreme Admin', subtitle: 'M1 Platform', eyebrow: 'Platform Control' },
    superadmin: { name: 'Super Admin', subtitle: 'M1 Platform', eyebrow: 'Platform Control' },
    commander_admin: { name: 'Arjun Raj', subtitle: 'Agency Commander', eyebrow: 'Agency Growth OS' },
    agency_super_admin: { name: 'Agency Admin', subtitle: 'Alpha Partners', eyebrow: 'Agency Portal' },
    agency_manager: { name: 'Agency Manager', subtitle: 'Alpha Partners', eyebrow: 'Agency Portal' },
    agency: { name: 'Agency Manager', subtitle: 'Alpha Partners', eyebrow: 'Agency Portal' },
    agency_client: { name: 'Delhi Ghosh', subtitle: 'Executive', eyebrow: 'Executive Portal' },
    brand_super_admin: { name: 'Delhi Ghosh', subtitle: 'Brand Admin', eyebrow: 'Executive Portal' },
    brand_manager: { name: 'Delhi Ghosh', subtitle: 'Executive', eyebrow: 'Executive Portal' },
    brand_team_user: { name: 'Delhi Ghosh', subtitle: 'Brand Team', eyebrow: 'Executive Portal' },
    client: { name: 'Delhi Ghosh', subtitle: 'Executive', eyebrow: 'Executive Portal' },
  };

  const defaultDetails = roleDefaults[role] || { name: 'User', subtitle: 'Workspace', eyebrow: 'M1 Platform' };
  const displayName = user?.name || user?.fullName || defaultDetails.name;
  
  // Use dynamically fetched data if available
  const dynamicSubtitle = user?.brandName || user?.agencyName || user?.companyName || user?.designation || user?.title || defaultDetails.subtitle;
  const dynamicEyebrow = user?.roleName || defaultDetails.eyebrow;

  const userDetails = {
    name: displayName,
    subtitle: dynamicSubtitle,
    initial: getInitials(displayName),
    eyebrow: dynamicEyebrow,
  };

  const getHeaderCopy = () => {
    if (location.pathname.startsWith('/client')) {
      if (role === 'brand_super_admin') {
        return {
          eyebrow: 'Executive Portal',
          title: 'Brand Administration',
          subtitle: 'Manage your workspace, billing, team access, and marketing operations.',
        };
      }
      return {
        eyebrow: userDetails.eyebrow,
        title: `${getGreeting()}, ${userDetails.name} 👋`,
        subtitle: "Here's your marketing performance overview.",
      };
    }

    if (location.pathname.startsWith('/agency')) {
      return {
        eyebrow: userDetails.eyebrow,
        title: `${getGreeting()}, ${userDetails.name} 👋`,
        subtitle: 'Track client momentum, delivery health, and agency operations.',
      };
    }

    if (location.pathname.startsWith('/superadmin')) {
      return {
        eyebrow: 'Platform Control',
        title: 'Super Admin Command Center',
        subtitle: 'Monitor companies, subscriptions, integrations, and platform health.',
      };
    }

    if (location.pathname.startsWith('/user')) {
      return {
        eyebrow: 'Personal Workspace',
        title: `${getGreeting()}, ${userDetails.name} 👋`,
        subtitle: 'Review your tasks, updates, and workspace settings.',
      };
    }

    return {
      eyebrow: userDetails.eyebrow,
      title: `${getGreeting()}, ${userDetails.name} 👋`,
      subtitle: "Here's your agency performance overview.",
    };
  };

  const headerCopy = getHeaderCopy();

  const origUserStr = localStorage.getItem('original_user');
  const origUser = origUserStr ? JSON.parse(origUserStr) : null;
  let revertPanelName = '';
  if (origUser) {
    if (origUser.role === 'commander_admin') revertPanelName = 'Commander Admin';
    else if (origUser.role === 'agency_manager' || origUser.role === 'agency') revertPanelName = 'Agency Manager';
    else if (origUser.role === 'brand_manager') revertPanelName = 'Brand Manager';
    else if (origUser.role === 'agency_super_admin') revertPanelName = 'Agency Admin';
    else if (origUser.role === 'brand_super_admin') revertPanelName = 'Brand Admin';
    else if (origUser.role === 'superadmin' || origUser.role === 'supreme_super_admin') revertPanelName = 'Super Admin';
    else revertPanelName = 'Original Panel';
  }

  const userMenuItems = [
    { key: 'profile', label: 'My Profile', icon: <User size={16} /> },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', danger: true, icon: <LogOut size={16} /> },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') {
      if (['supreme_super_admin', 'superadmin'].includes(role)) {
        navigate('/superadmin/dashboard');
      } else if (['commander_admin'].includes(role)) {
        navigate('/settings/company');
      } else if (['agency_super_admin', 'agency_manager', 'agency'].includes(role)) {
        navigate('/agency/settings');
      } else if (['brand_super_admin', 'brand_manager', 'agency_client', 'brand_team_user', 'client'].includes(role)) {
        navigate('/client/settings/company');
      } else {
        navigate('/user/settings');
      }
    }
    if (key === 'logout') logout();
  };

  return (
    <AntHeader className="app-header">
      <div className="app-header__left">
        {!screens.lg && (
          <Button
            type="text"
            icon={<MenuIcon size={20} />}
            onClick={toggleMobileMenu}
            className="app-header__icon-button"
            aria-label="Open navigation"
          />
        )}

        <div className="app-header__title-block">
          <span>{headerCopy.eyebrow}</span>
          <h1>{headerCopy.title}</h1>
          {screens.sm && <p>{headerCopy.subtitle}</p>}
        </div>
      </div>

      <div className="app-header__actions">
        {origUser && (
          <Button
            type="primary"
            onClick={handleRevertImpersonation}
            style={{ background: '#d9363e', borderColor: '#d9363e' }}
            className="app-header__super-button"
          >
            Back to {revertPanelName}
          </Button>
        )}

        {role === 'supreme_super_admin' && !location.pathname.startsWith('/superadmin') && !origUser && (
          <Button
            type="primary"
            onClick={() => navigate('/superadmin/dashboard')}
            className="app-header__super-button"
          >
            Back to Super Admin
          </Button>
        )}

        <Button
          type="text"
          icon={isDark ? <Sun size={19} /> : <Moon size={19} />}
          onClick={toggleTheme}
          className="app-header__icon-button"
          aria-label="Toggle theme"
        />

        <Popover
          content={notificationContent}
          title="Notifications"
          trigger="click"
          open={notifsVisible}
          onOpenChange={(v) => {
            setNotifsVisible(v);
            if (v) fetchNotifications();
          }}
          placement="bottomRight"
        >
          <Badge count={unreadCount} offset={[-5, 5]}>
            <Button
              type="text"
              icon={<Bell size={19} />}
              className="app-header__icon-button"
              aria-label="Notifications"
            />
          </Badge>
        </Popover>

        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button type="button" className="app-header__user">
            <Avatar className="app-header__avatar">{userDetails.initial}</Avatar>
            {screens.sm && (
              <span className="app-header__user-copy">
                <strong>{userDetails.name}</strong>
                <small>{userDetails.subtitle}</small>
              </span>
            )}
            {screens.sm && <ChevronDown size={15} />}
          </button>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
