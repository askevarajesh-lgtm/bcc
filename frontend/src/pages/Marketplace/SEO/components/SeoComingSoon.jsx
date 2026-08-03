import React from 'react';
import { Typography, Empty } from 'antd';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

/**
 * Shared "not built yet" state for every Marketplace > SEO sub-page.
 * Phase 1 only wires up routing / menu / navigation — this keeps every
 * empty page visually consistent without duplicating markup per page.
 */
const SeoComingSoon = ({ title, description, icon: Icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && (
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', color: 'var(--accent-primary)' }}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <Title level={2} style={{ margin: 0 }}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>
      </div>

      <div className="glassmorphism" style={{ padding: '80px 24px', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', border: '1px dashed var(--border-color)' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ marginTop: 16 }}>
              <Title level={4} style={{ color: 'var(--text-primary)' }}>Coming Soon</Title>
              <Text type="secondary" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
                This section is wired up and ready — functionality is being built out next.
              </Text>
            </div>
          }
        />
      </div>
    </motion.div>
  );
};

export default SeoComingSoon;
