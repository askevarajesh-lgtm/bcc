import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Typography, Card } from 'antd';
import { motion } from 'framer-motion';
import {
  LayoutGrid, ClipboardCheck, Hash, Swords, Sparkles, Cpu, LayoutTemplate,
  ShoppingBag, BookOpen, MessageCircle, Globe2, FileText, Zap, Activity, Settings, Search
} from 'lucide-react';

const { Title, Text } = Typography;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'audit', label: 'Audit', icon: ClipboardCheck },
  { id: 'keywords', label: 'Keywords', icon: Hash },
  { id: 'competitors', label: 'Competitors', icon: Swords },
  { id: 'content-ai', label: 'Content AI', icon: Sparkles },
  { id: 'technical-seo', label: 'Technical SEO', icon: Cpu },
  { id: 'website-builder', label: 'Website Builder', icon: LayoutTemplate },
  { id: 'store-seo', label: 'Store SEO', icon: ShoppingBag },
  { id: 'blog-seo', label: 'Blog SEO', icon: BookOpen },
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

const MarketplaceSEO = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.split('/marketplace/seo')[0] + '/marketplace/seo';
  const activeId = NAV_ITEMS.find((item) => location.pathname.includes(`/${item.id}`))?.id || 'dashboard';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 16,
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Search size={28} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 900 }}>SEO</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
            Marketplace / SEO — projects, audits, keywords, and automation in one workspace.
          </Text>
        </div>
      </motion.div>

      {/* Sub-navigation */}
      <motion.div
        variants={itemVariants}
        style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', paddingBottom: 0 }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => navigate(`${basePath}/${item.id}`)}
              style={{
                padding: '12px 14px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                fontWeight: isActive ? 800 : 600,
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

      <motion.div variants={itemVariants}>
        <Card style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          <Outlet />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MarketplaceSEO;
