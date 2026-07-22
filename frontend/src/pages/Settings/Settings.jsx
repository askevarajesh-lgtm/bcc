import React, { useState } from 'react';
import { Typography, Tabs } from 'antd';
import { motion } from 'framer-motion';

import AgencyTab from './tabs/AgencyTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import TeamAccessTab from './tabs/TeamAccessTab';
import NotificationsTab from './tabs/NotificationsTab';
import BackendConfigTab from './tabs/BackendConfigTab';
import AccessMatrixTab from './tabs/AccessMatrixTab';
import UserManagementTab from './tabs/UserManagementTab';
import AgencyPackagesTab from './tabs/AgencyPackagesTab';
import DirectPackagesTab from './tabs/DirectPackagesTab';
import ClientPackagesTab from '../AgencyPortal/tabs/ClientPackagesTab';
import UserSettingsTab from '../UserPortal/SettingsTab';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const SettingsPage = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return ['agency_manager', 'brand_manager'].includes(role) ? '7' : '1';
  });

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

  const renderContent = () => {
    switch(activeTab) {
      case '1': return <AgencyTab />;
      case '2': return <IntegrationsTab />;
      case '3': return <TeamAccessTab />;
      case '4': return <NotificationsTab />;
      case '5': return <BackendConfigTab />;
      case '6': return <AccessMatrixTab />;
      case '7': return <UserManagementTab />;
      case '8': return <AgencyPackagesTab />;
      case '10': return <DirectPackagesTab />;
      case '11': return <ClientPackagesTab />;
      case '9': return <UserSettingsTab />;
      default: return <AgencyTab />;
    }
  };

  const allTabs = [
    { key: '1', label: <strong style={{ fontWeight: 600 }}>Agency</strong> },
    { key: '2', label: <strong style={{ fontWeight: 600 }}>Integrations</strong> },
    // { key: '3', label: <strong style={{ fontWeight: 600 }}>Team & Access</strong> },
    { key: '4', label: <strong style={{ fontWeight: 600 }}>Notifications</strong> },
    // { key: '5', label: <strong style={{ fontWeight: 600 }}>Backend Config</strong> },
    // { key: '6', label: <strong style={{ fontWeight: 600 }}>Access Matrix</strong> },
    { key: '7', label: <strong style={{ fontWeight: 600 }}>User Management</strong> },
    { key: '9', label: <strong style={{ fontWeight: 600 }}>Profile</strong> },
    ...(['commander_admin', 'brand_super_admin', 'brand_manager'].includes(role) ? [] : [
      { key: '11', label: <strong style={{ fontWeight: 600 }}>Client Packages</strong> }
    ]),
    ...(['brand_super_admin', 'brand_manager'].includes(role) ? [] : [
      { key: '8', label: <strong style={{ fontWeight: 600 }}>Agency Packages</strong> },
      { key: '10', label: <strong style={{ fontWeight: 600 }}>Direct Brand Packages</strong> }
    ]),
  ];

  const tabItems = ['agency_manager', 'brand_manager'].includes(role) 
    ? allTabs.filter(t => ['2', '7', '9', '11'].includes(t.key))
    : allTabs;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Settings</Title>
        <Text type="secondary" style={{ fontWeight: 500 }}>Configure how the M1 platform works for BCC Martech.</Text>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ marginBottom: 32 }} 
          size="large"
          items={tabItems}
        />
      </motion.div>

      {renderContent()}

    </motion.div>
  );
};

export default SettingsPage;
