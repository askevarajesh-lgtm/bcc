import React, { useState } from 'react';
import { Typography, Card, Button, Tabs, Space } from 'antd';
import { Activity, Bell, Settings, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MonitoringProvider, useMonitoring } from './MonitoringComponents/MonitoringContext';
import Overview from './MonitoringComponents/components/Overview/Overview';
import AlertsView from './MonitoringComponents/components/Alerts/AlertsView';

const { Title, Text } = Typography;

const MonitoringLayout = ({ project }) => {
  const { isScanning, triggerScan } = useMonitoring();
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} /> Overview
        </span>
      ),
      children: <Overview project={project} />
    },
    {
      key: 'alerts',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} /> Alerts
        </span>
      ),
      children: <AlertsView project={project} />
    },
    {
      key: 'history',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={16} /> History
        </span>
      ),
      children: (
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
            History Charts coming soon...
          </div>
        </Card>
      )
    },
    {
      key: 'settings',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={16} /> Settings
        </span>
      ),
      children: (
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
            Monitoring Settings coming soon...
          </div>
        </Card>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity size={28} color="#1890ff" />
          <div>
            <Title level={4} style={{ margin: 0 }}>Enterprise Monitoring</Title>
            <Text type="secondary">Single source of truth for SEO health and alerts</Text>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<Activity size={16} />} 
          onClick={triggerScan} 
          loading={isScanning}
        >
          {isScanning ? 'Scan in Progress...' : 'Run Manual Scan'}
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
        size="large"
      />
    </motion.div>
  );
};

const MonitoringTab = ({ project }) => {
  return (
    <MonitoringProvider project={project}>
      <MonitoringLayout project={project} />
    </MonitoringProvider>
  );
};

export default MonitoringTab;
