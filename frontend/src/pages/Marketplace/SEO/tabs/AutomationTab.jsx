import React, { useState, Suspense, useEffect } from 'react';
import { Tabs, Spin, Typography, message, Table, Button, Tag, Space, Popconfirm } from 'antd';
import { Rocket, ListTree, Activity, Clock, BarChart, Settings as SettingsIcon, FileText, Zap } from 'lucide-react';

import Dashboard from './AutomationComponents/Dashboard';
import WorkflowsList from './AutomationComponents/WorkflowsList';
import ExecutionHistory from './AutomationComponents/ExecutionHistory';
import QueueMonitor from './AutomationComponents/QueueMonitor';
import './AutomationTab.css';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';

const WorkflowEditor = React.lazy(() => import('./AutomationComponents/WorkflowEditor/WorkflowEditor'));
const TemplatesList = React.lazy(() => import('./AutomationComponents/TemplatesList'));

const { Title } = Typography;

// Temporary internal components for tabs not yet fully split out
const SettingsPanel = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={4}>Automation Settings</Title>
    <p>Configure global automation concurrency, webhook limits, and provider API keys here.</p>
  </div>
);

const AnalyticsPanel = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={4}>Automation Analytics</Title>
    <p>View long-term execution trends, success/failure rates, and AI token usage.</p>
  </div>
);

const LogsPanel = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={4}>System Logs</Title>
    <p>Raw system logs for deep debugging of Execution Engine failures and Event Bus dispatches.</p>
  </div>
);

const LegacyAutomationsPanel = ({ projectId }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await seoWorkspaceApi.getAutomationRules(projectId);
      setRules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to load legacy rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const columns = [
    { title: 'Type', dataIndex: 'ruleType', key: 'ruleType', render: t => <Tag color="blue">{t}</Tag> },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag> }
  ];

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
      <Title level={4}>Legacy Rules (v1)</Title>
      <Table dataSource={rules} columns={columns} rowKey="_id" loading={loading} />
    </div>
  );
};


export default function AutomationTab({ projectId }) {
  const effectiveProjectId = projectId || '507f1f77bcf86cd799439011';
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
      <Suspense fallback={<div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" tip="Loading Workflow Builder..." /></div>}>
        <WorkflowEditor projectId={effectiveProjectId} workflowId={editingWorkflowId} onClose={handleCloseEditor} />
      </Suspense>
    );
  }

  const items = [
    {
      key: 'dashboard',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16} /> Dashboard</span>,
      children: <Dashboard projectId={effectiveProjectId} />
    },
    {
      key: 'workflows',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ListTree size={16} /> Workflows</span>,
      children: <WorkflowsList projectId={effectiveProjectId} onEdit={handleEditWorkflow} />
    },
    {
      key: 'templates',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Rocket size={16} /> Templates</span>,
      children: (
        <Suspense fallback={<Spin />}>
          <TemplatesList projectId={effectiveProjectId} />
        </Suspense>
      )
    },
    {
      key: 'history',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} /> Executions</span>,
      children: <ExecutionHistory projectId={effectiveProjectId} />
    },
    {
      key: 'queue',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart size={16} /> Queue</span>,
      children: <QueueMonitor projectId={effectiveProjectId} />
    },
    {
      key: 'analytics',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart size={16} /> Analytics</span>,
      children: <AnalyticsPanel />
    },
    {
      key: 'logs',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Logs</span>,
      children: <LogsPanel />
    },
    {
      key: 'settings',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SettingsIcon size={16} /> Settings</span>,
      children: <SettingsPanel />
    },
    {
      key: 'legacy',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> Legacy</span>,
      children: <LegacyAutomationsPanel projectId={effectiveProjectId} />
    }
  ];

  return (
    <div className="automation-tab-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>Enterprise Automation Engine</Title>
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