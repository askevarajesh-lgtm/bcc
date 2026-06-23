import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const AgencySubscriptionsTab = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Subscriptions</Title>
      <Text type="secondary">Manage your clients' subscription plans.</Text>
      <div className="glassmorphism" style={{ padding: '40px', marginTop: '24px', borderRadius: 16, textAlign: 'center' }}>
        <Text type="secondary">Subscription management coming soon.</Text>
      </div>
    </motion.div>
  );
};

export default AgencySubscriptionsTab;
