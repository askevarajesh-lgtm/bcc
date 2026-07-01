import React from 'react';
import { Drawer, Grid, Layout, Menu } from 'antd';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useLayoutContext } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContext';

const { Sider } = Layout;

const PortalSidebar = ({
  collapsed = false,
  setCollapsed,
  width = 276,
  brandInitials = 'M1',
  brandTitle = 'M1',
  brandSubtitle = 'Growth OS',
  accent = '#10b981',
  accentSoft = 'rgba(16, 185, 129, 0.12)',
  menuItems = [],
  selectedKeys = [],
  defaultOpenKeys = [],
  onNavigate,
  partner,
}) => {
  const { isDark } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayoutContext();
  const screens = Grid.useBreakpoint();

  const handleMenuClick = ({ key }) => {
    if (onNavigate) onNavigate(key);
    if (!screens.lg) setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <Sider
      collapsible={Boolean(setCollapsed)}
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed?.(value)}
      trigger={null}
      width={width}
      collapsedWidth={88}
      theme={isDark ? 'dark' : 'light'}
      className="app-sidebar"
      style={{
        '--sidebar-accent': accent,
        '--sidebar-accent-soft': accentSoft,
      }}
    >
      <div className="app-sidebar__brand">
        <div className="app-sidebar__logo">{brandInitials}</div>
        {!collapsed && (
          <div className="app-sidebar__brand-copy">
            <strong>{brandTitle}</strong>
            <span>{brandSubtitle}</span>
          </div>
        )}
      </div>

      <div className="app-sidebar__content">
        <div className="app-sidebar__menu">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={defaultOpenKeys}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </div>

        {partner && !collapsed && (
          <div className="sidebar-partner-card">
            <div className="sidebar-partner-card__body">
              <div className="sidebar-partner-card__avatar">{partner.initials}</div>
              <div>
                <span>{partner.label}</span>
                <strong>{partner.name}</strong>
                <small>{partner.title}</small>
              </div>
            </div>
            <div className="sidebar-partner-card__actions" aria-label="Growth partner contact actions">
              <button type="button" aria-label="Call growth partner">
                <Phone size={16} />
              </button>
              <button type="button" aria-label="Message growth partner">
                <MessageCircle size={16} />
              </button>
              <button type="button" aria-label="Email growth partner">
                <Mail size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Sider>
  );

  if (!screens.lg && screens.lg !== undefined) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
        width={width}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return sidebarContent;
};

export default PortalSidebar;
