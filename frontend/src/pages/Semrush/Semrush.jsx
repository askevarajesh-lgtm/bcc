import React, { useState } from 'react';
import { Typography, Tabs, Card, Spin } from 'antd';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

import { Outlet } from 'react-router-dom';

const { Title, Text } = Typography;

const Semrush = () => {

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '50%', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Search size={32} style={{ color: 'var(--accent-secondary)' }} />
        </div>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Semrush</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            SEO Intelligence & Analytics
          </Text>
        </div>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <Outlet />
      </Card>
    </motion.div>
  );
};

export default Semrush;
