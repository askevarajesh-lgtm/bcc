import React from 'react';
import { Drawer, Grid, Layout, Menu } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import { Mail, Phone } from 'lucide-react';
import { useLayoutContext } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContext';

const { Sider } = Layout;

const PortalSidebar = ({
  collapsed = false,
  setCollapsed,
  width = 276,
  brandInitials = 'M1',
  brandLogo = null,
  brandLogoDark = null,
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

  const isMobile = !screens.lg && screens.lg !== undefined;

  const rootSubmenuKeys = menuItems
    .filter(item => item && item.children)
    .map(item => item.key);

  const getParentKeyForSelected = () => {
    for (const item of menuItems) {
      if (item.children) {
        const hasMatch = item.children.some(child => 
          selectedKeys.includes(child.key) || 
          (child.children && child.children.some(c => selectedKeys.includes(c.key)))
        );
        if (hasMatch) return item.key;
      }
    }
    return null;
  };

  const [openKeys, setOpenKeys] = React.useState(() => {
    const parent = getParentKeyForSelected();
    return parent ? [parent] : [];
  });

  React.useEffect(() => {
    const parent = getParentKeyForSelected();
    if (parent && !openKeys.includes(parent)) {
      setOpenKeys([parent]);
    }
  }, [selectedKeys]);

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 0' }}>
          <img 
            src={(isDark ? (brandLogoDark || brandLogo || '/logo-dark.png') : (brandLogo || '/logo-light.png'))} 
            alt={brandTitle ? `${brandTitle} Logo` : "Logo"} 
            style={{ 
              maxWidth: '70%', 
              maxHeight: 72, 
              objectFit: 'contain' 
            }} 
          />
        </div>
      </div>

      <div className="app-sidebar__content">
        <div className="app-sidebar__menu">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={collapsed ? undefined : openKeys}
            onOpenChange={handleOpenChange}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </div>

        {partner && !collapsed && (
          <div className="sidebar-partner-card">
            <div className="sidebar-partner-card__body">
              <div className="sidebar-partner-card__avatar">
                {partner.avatar ? (
                  <img src={partner.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  partner.initials
                )}
              </div>
              <div>
                <span>{partner.label}</span>
                <strong>{partner.name}</strong>
                <small>{partner.title}</small>
              </div>
            </div>
            <div className="sidebar-partner-card__actions" aria-label="Growth partner contact actions">
              {partner.phone ? (
                <a href={`tel:${partner.phone}`} aria-label="Call growth partner" style={{ textDecoration: 'none' }}>
                  <Phone size={16} />
                </a>
              ) : (
                <button type="button" aria-label="Call growth partner" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <Phone size={16} />
                </button>
              )}
              {partner.phone ? (
                <a href={`https://wa.me/${partner.phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Message growth partner" style={{ textDecoration: 'none' }}>
                  <WhatsAppOutlined style={{ fontSize: 16 }} />
                </a>
              ) : (
                <button type="button" aria-label="Message growth partner" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <WhatsAppOutlined style={{ fontSize: 16 }} />
                </button>
              )}
              {partner.email ? (
                <a href={`mailto:${partner.email}`} aria-label="Email growth partner" style={{ textDecoration: 'none' }}>
                  <Mail size={16} />
                </a>
              ) : (
                <button type="button" aria-label="Email growth partner" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <Mail size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Sider>
  );

  return sidebarContent;
};

export default PortalSidebar;
