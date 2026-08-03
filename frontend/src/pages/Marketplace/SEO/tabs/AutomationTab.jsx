import React, { useState, Suspense, useEffect } from 'react';
import { Tabs, Spin, Typography, message } from 'antd';
import { Rocket, ListTree, Activity, Clock, BarChart, Settings as SettingsIcon, FileText, Zap, ShieldCheck, Bell, Calendar } from 'lucide-react';
import { useSEO } from '../context/SEOContext';

import Dashboard from './AutomationComponents/Dashboard';
import WorkflowsList from './AutomationComponents/WorkflowsList';
import ExecutionHistory from './AutomationComponents/ExecutionHistory';
import QueueMonitor from './AutomationComponents/QueueMonitor';
import AnalyticsPanel from './AutomationComponents/panels/AnalyticsPanel';
import SchedulerPanel from './AutomationComponents/panels/SchedulerPanel';
import SecretVaultPanel from './AutomationComponents/panels/SecretVaultPanel';
import NotificationCenterPanel from './AutomationComponents/panels/NotificationCenterPanel';
import LogsPanel from './AutomationComponents/panels/LogsPanel';
import SettingsPanel from './AutomationComponents/panels/SettingsPanel';
import './AutomationTab.css';

const WorkflowEditor = React.lazy(() => import('./AutomationComponents/WorkflowEditor/WorkflowEditor'));
const TemplatesList = React.lazy(() => import('./AutomationComponents/TemplatesList'));

const { Title } = Typography;

export default function AutomationTab({ projectId: propProjectId }) {
  const { activeProjectId: contextProjectId } = useSEO();
  const effectiveProjectId = propProjectId || contextProjectId;
  const [activeView, setActiveView] = useState('dashboard');
  const [editingWorkflowId, setEditingWorkflowId] = useState(null);

  const handleEditWorkflow = (workflowId) => {
    setEditingWorkflowId(workflowId);
    setActiveView('editor');
  };

  const handleCloseEditor = () => {
    setEditingWorkflowId(null);
    setActiveView('workflows');
  };

  if (activeView === 'editor') {
    return (
      <Suspense fallback={<div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" tip="Loading Visual Workflow Studio..." /></div>}>
        <WorkflowEditor projectId={effectiveProjectId} workflowId={editingWorkflowId} onClose={handleCloseEditor} />
      </Suspense>
    );
  }

  const items = [
    {
      key: 'dashboard',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={15} /> Dashboard</span>,
      children: <Dashboard projectId={effectiveProjectId} onNavigateToEditor={handleEditWorkflow} />
    },
    {
      key: 'workflows',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ListTree size={15} /> Workflows</span>,
      children: <WorkflowsList projectId={effectiveProjectId} onEdit={handleEditWorkflow} />
    },
    {
      key: 'templates',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Rocket size={15} /> Templates (15+)</span>,
      children: (
        <Suspense fallback={<Spin />}>
          <TemplatesList projectId={effectiveProjectId} onUseTemplate={handleEditWorkflow} />
        </Suspense>
      )
    },
    {
      key: 'scheduler',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={15} /> Scheduler</span>,
      children: <SchedulerPanel projectId={effectiveProjectId} />
    },
    {
      key: 'vault',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={15} /> Secret Vault</span>,
      children: <SecretVaultPanel projectId={effectiveProjectId} />
    },
    {
      key: 'notifications',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={15} /> Notification Hub</span>,
      children: <NotificationCenterPanel projectId={effectiveProjectId} />
    },
    {
      key: 'history',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={15} /> Executions</span>,
      children: <ExecutionHistory projectId={effectiveProjectId} />
    },
    {
      key: 'queue',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={15} /> Priority Queue</span>,
      children: <QueueMonitor projectId={effectiveProjectId} />
    },
    {
      key: 'analytics',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart size={15} /> Analytics</span>,
      children: <AnalyticsPanel projectId={effectiveProjectId} />
    },
    {
      key: 'logs',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={15} /> System Logs</span>,
      children: <LogsPanel projectId={effectiveProjectId} />
    },
    {
      key: 'settings',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SettingsIcon size={15} /> Settings</span>,
      children: <SettingsPanel projectId={effectiveProjectId} />
    }
  ];

  return (
    <div className="automation-tab-container" style={{ padding: '0 8px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>Enterprise SEO Automation Platform</Title>
      </div>
      <Tabs 
        activeKey={activeView}
        onChange={setActiveView}
        items={items}
        animated={false}
        className="automation-main-tabs"
      />
    </div>
  );
}