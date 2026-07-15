import React, { useState } from 'react';
import { Typography, Row, Col, Card, Button, Tabs, Tag } from 'antd';
import { motion } from 'framer-motion';
import SEOWorkspace from './SEOWorkspace';
import Content from '../Content/Content';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Marketplace = () => {
  const { role } = useAuth();
  const isAgencyRole = ['agency_super_admin', 'agency_manager', 'agency'].includes(role);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Retail Tag Card Component
  const RetailTagCard = ({ children, style, bodyStyle }) => (
    <Card
      className="glassmorphism"
      bodyStyle={{ padding: '32px 24px', ...bodyStyle }}
      style={{
        borderRadius: '32px 32px 12px 12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--bg-secondary)',
        position: 'relative',
        ...style
      }}
    >
      {/* The Hole Punch */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }} />
      {children}
    </Card>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>MARKETPLACE</Text>
        {!isAgencyRole && (
          <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>SEO Workspace</Title>
        )}
      </motion.div>

      {isAgencyRole ? (
        <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
          <TabPane tab="SEO" key="1">
            <motion.div variants={itemVariants} style={{ marginBottom: 48, marginTop: 16 }}>
              <Title level={2} style={{ margin: '4px 0 24px 0', fontWeight: 800 }}>SEO Workspace</Title>
              <SEOWorkspace />
            </motion.div>
          </TabPane>
          <TabPane tab="Content" key="2">
            <motion.div variants={itemVariants} style={{ marginBottom: 48, marginTop: 16 }}>
              <Content />
            </motion.div>
          </TabPane>
        </Tabs>
      ) : (
        <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
          <SEOWorkspace />
        </motion.div>
      )}

    </motion.div>

  );
};

export default Marketplace;