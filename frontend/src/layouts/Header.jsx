import React from 'react';
import { Avatar, Badge, Button, Dropdown, Grid, Layout } from 'antd';
import {
  Bell,
  CalendarDays,
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

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { role, user, logout } = useAuth();
  const { toggleMobileMenu } = useLayoutContext();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

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

  const formatDateRange = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const endFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateFormatter.format(start)} – ${endFormatter.format(end)}`;
  };

  const headerCopy = getHeaderCopy();

  const userMenuItems = [
    { key: 'profile', label: 'My Profile', icon: <User size={16} /> },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', danger: true, icon: <LogOut size={16} /> },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') {
      if (location.pathname.startsWith('/client')) {
        navigate('/client/settings/company');
      } else if (location.pathname.startsWith('/agency')) {
        navigate('/agency/settings');
      } else if (location.pathname.startsWith('/superadmin')) {
        navigate('/superadmin/dashboard'); // Or superadmin profile if exists
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
        {role === 'supreme_super_admin' && !location.pathname.startsWith('/superadmin') && (
          <Button
            type="primary"
            onClick={() => navigate('/superadmin/dashboard')}
            className="app-header__super-button"
          >
            Back to Super Admin
          </Button>
        )}

        {screens.md && (
          <Button className="app-header__date-pill">
            <CalendarDays size={18} />
            <span>{formatDateRange()}</span>
            <ChevronDown size={16} />
          </Button>
        )}

        <Button
          type="text"
          icon={isDark ? <Sun size={19} /> : <Moon size={19} />}
          onClick={toggleTheme}
          className="app-header__icon-button"
          aria-label="Toggle theme"
        />

        <Badge dot offset={[-5, 5]}>
          <Button
            type="text"
            icon={<Bell size={19} />}
            className="app-header__icon-button"
            aria-label="Notifications"
          />
        </Badge>

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
