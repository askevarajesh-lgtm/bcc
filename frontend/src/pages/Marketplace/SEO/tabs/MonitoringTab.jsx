import React, { useState } from 'react';
import { Typography, Card, Button, Tabs, Space, Tag } from 'antd';
import { 
  Activity, Bell, Settings, BarChart2, ShieldAlert, Sparkles, 
  Layers, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MonitoringProvider, useMonitoring } from './MonitoringComponents/MonitoringContext';
import ProjectSelector from '../components/shared/ProjectSelector';
import Overview from './MonitoringComponents/components/Overview/Overview';
import AlertsView from './MonitoringComponents/components/Alerts/AlertsView';
import HealthBreakdownView from './MonitoringComponents/components/HealthBreakdownView';
import RiskAssessmentView from './MonitoringComponents/components/RiskAssessmentView';
import OpportunitiesView from './MonitoringComponents/components/OpportunitiesView';
import HistoryView from './MonitoringComponents/components/HistoryView';
import MonitoringSettingsView from './MonitoringComponents/components/MonitoringSettingsView';

const { Title, Text } = Typography;

const MonitoringLayout = ({ project }) => {
  const { isScanning, triggerScan, activeProjectId, setProjectId } = useMonitoring();
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={15} /> Overview
        </span>
      ),
      children: (
        <Overview 
          project={project} 
          onNavigateToAlerts={() => setActiveTab('alerts')}
          onNavigateToOpps={() => setActiveTab('opportunities')}
        />
      )
    },
    {
      key: 'alerts',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={15} /> Active Alerts
        </span>
      ),
      children: <AlertsView project={project} />
    },
    {
      key: 'diagnostics',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={15} /> 11-Plugin Diagnostics
        </span>
      ),
      children: <HealthBreakdownView project={project} />
    },
    {
      key: 'risk',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={15} /> Risk Assessment
        </span>
      ),
      children: <RiskAssessmentView project={project} />
    },
    {
      key: 'opportunities',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#7c3aed" /> High-ROI Opportunities
        </span>
      ),
      children: <OpportunitiesView project={project} />
    },
    {
      key: 'history',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={15} /> Trend History
        </span>
      ),
      children: <HistoryView project={project} />
    },
    {
      key: 'settings',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Settings size={15} /> Settings
        </span>
      ),
      children: <MonitoringSettingsView project={project} />
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ padding: '0 8px' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center' }}>
            <Activity size={24} color="#2563eb" />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>Enterprise Monitoring Command Center</Title>
            <Text type="secondary">Continuous multi-plugin surveillance, AI root-cause diagnostics, and penalty risk protection</Text>
          </div>
        </div>
        <Space wrap>
          {!project && (
            <ProjectSelector showRefresh={false} />
          )}
          <Button 
            type="primary" 
            icon={<RefreshCw size={15} className={isScanning ? 'spin' : ''} />} 
            onClick={triggerScan} 
            loading={isScanning}
            style={{ background: '#2563eb' }}
          >
            {isScanning ? 'Executing 11-Plugin Scan...' : 'Trigger Immediate Scan'}
          </Button>
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
        size="large"
        animated={false}
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
