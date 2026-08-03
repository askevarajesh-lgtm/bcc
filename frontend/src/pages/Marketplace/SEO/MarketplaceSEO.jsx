import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Typography, Card, Tag, Space, Button, Badge } from 'antd';
import { motion } from 'framer-motion';
import {
  LayoutGrid, ClipboardCheck, Hash, Swords, Sparkles, Cpu, LayoutTemplate,
  ShoppingBag, BookOpen, MessageCircle, Globe2, FileText, Zap, Activity, Settings, Search,
  Globe, ExternalLink, ActivitySquare
} from 'lucide-react';
import { SEOProvider, useSEO } from './context/SEOContext';
import ProjectSelector from './components/shared/ProjectSelector';

const { Title, Text } = Typography;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'audit', label: 'Audit', icon: ClipboardCheck },
  { id: 'keywords', label: 'Keywords', icon: Hash },
  { id: 'competitors', label: 'Competitors', icon: Swords },
  { id: 'content-ai', label: 'Content AI', icon: Sparkles },
  { id: 'technical-seo', label: 'Technical SEO', icon: Cpu },
  // { id: 'website-builder', label: 'Website Builder', icon: LayoutTemplate },
  // { id: 'store-seo', label: 'Store SEO', icon: ShoppingBag },
  // { id: 'blog-seo', label: 'Blog SEO', icon: BookOpen },
  { id: 'aeo', label: 'AEO', icon: MessageCircle },
  { id: 'geo', label: 'GEO', icon: Globe2 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const MarketplaceSEOContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProject, activeProjectId } = useSEO();

  const basePath = location.pathname.split('/marketplace/seo')[0] + '/marketplace/seo';
  const activeId = NAV_ITEMS.find((item) => location.pathname.includes(`/${item.id}`))?.id || 'dashboard';

  const domainUrl = activeProject?.domain
    ? (activeProject.domain.startsWith('http') ? activeProject.domain : `https://${activeProject.domain}`)
    : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header & Global Project Selector Banner */}
      <motion.div
        variants={itemVariants}
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'var(--bg-secondary, #fafafa)',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-color, #e8e8e8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            padding: 12,
            borderRadius: 10,
            border: '1px solid var(--border-color, #e8e8e8)',
            boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Search size={24} style={{ color: 'var(--accent-primary, #1890ff)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Workspace SEO</Title>
              {activeProject && (
                <Tag color="blue" style={{ fontWeight: 600, borderRadius: 4 }}>
                  {activeProject.name}
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              Enterprise SEO intelligence, audits, keyword tracking, AEO/GEO, and automation engine.
            </Text>
          </div>
        </div>

        {/* Global Active Project Switcher & Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <ProjectSelector showRefresh={false} />

          {activeProject && (
            <Space size={8} wrap>
              {domainUrl && (
                <Button
                  size="middle"
                  icon={<Globe size={14} />}
                  href={domainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {activeProject.domain} <ExternalLink size={12} style={{ opacity: 0.6 }} />
                </Button>
              )}
              {activeProject.stats?.healthScore != null && (
                <Tag color={activeProject.stats.healthScore >= 80 ? 'green' : activeProject.stats.healthScore >= 60 ? 'orange' : 'red'} style={{ padding: '4px 8px', fontSize: 12, fontWeight: 600 }}>
                  Health: {activeProject.stats.healthScore}/100
                </Tag>
              )}
            </Space>
          )}
        </div>
      </motion.div>

      {/* Sub-navigation Tabs */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--border-color, #e8e8e8)',
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 0
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => navigate(`${basePath}/${item.id}`)}
              style={{
                padding: '10px 14px',
                color: isActive ? 'var(--text-primary, #1890ff)' : 'var(--text-secondary, #595959)',
                borderBottom: isActive ? '3px solid var(--accent-primary, #1890ff)' : '3px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: -1,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={15} /> {item.label}
            </div>
          );
        })}
      </motion.div>

      {/* Active Tab Panel */}
      <motion.div variants={itemVariants}>
        <Card style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))' }}>
          <Outlet />
        </Card>
      </motion.div>
    </motion.div>
  );
};

const MarketplaceSEO = () => {
  return (
    <SEOProvider>
      <MarketplaceSEOContent />
    </SEOProvider>
  );
};

export default MarketplaceSEO;
