import React, { useState, Suspense } from 'react';
import { Tabs, Spin, Typography } from 'antd';
import { Rocket, ListTree, Activity, Clock, BarChart } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkflowsList from './components/WorkflowsList';
import ExecutionHistory from './components/ExecutionHistory';
import QueueMonitor from './components/QueueMonitor';
import './Automation.css';

// Lazy load the heavy Workflow Editor and Templates
const WorkflowEditor = React.lazy(() => import('./components/WorkflowEditor/WorkflowEditor'));
const TemplatesList = React.lazy(() => import('./components/TemplatesList'));

const { Title } = Typography;

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
      <Suspense fallback={<div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" tip="Loading Workflow Editor..." /></div>}>
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
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart size={16} /> Queue & Analytics</span>,
      children: <QueueMonitor projectId={effectiveProjectId} />
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
