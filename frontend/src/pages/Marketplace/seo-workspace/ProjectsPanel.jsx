import React from 'react';
import { Card, Table, Button, Tag, Typography, message } from 'antd';
import { Plus } from 'lucide-react';
import * as workspaceApi from './api/workspaceApi';

const { Title } = Typography;

const ProjectsPanel = ({ projects, loading, refetchProjects, isViewOnly, canAdd, onCreateProject, setActionLoading }) => {
  const triggerAudit = async (projectId) => {
    try {
      setActionLoading({ isLoading: true, message: 'Running crawler...' });
      await workspaceApi.runAudit(projectId);
      message.success({ content: 'Audit completed successfully!', key: 'audit' });
      refetchProjects();
    } catch (error) {
      console.error('Audit failed:', error);
      message.error({ content: 'Failed to run audit.', key: 'audit' });
    } finally {
      setActionLoading({ isLoading: false, message: '' });
    }
  };

  const triggerStrategy = async (projectId) => {
    try {
      setActionLoading({ isLoading: true, message: 'AI Agents are analyzing data and generating strategy...' });
      await workspaceApi.generateStrategy(projectId);
      message.success({ content: 'Strategy generated successfully!', key: 'strategy' });
      refetchProjects();
    } catch (error) {
      console.error('Strategy generation failed:', error);
      message.error({ content: 'Failed to generate strategy.', key: 'strategy' });
    } finally {
      setActionLoading({ isLoading: false, message: '' });
    }
  };

  const baseColumns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Site URL', dataIndex: 'domain', key: 'domain', render: (text) => <a href={`https://${text}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>{text}</a> },
    { title: 'Phase', dataIndex: 'phase', key: 'phase', render: phase => <Tag color="blue">{(phase || 'intake').toUpperCase()}</Tag> },
  ];

  const columns = (isViewOnly || !canAdd) ? baseColumns : [
    ...baseColumns,
    {
      title: 'Action', key: 'action', render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" size="small" onClick={() => triggerAudit(record._id)}>1. Audit</Button>
          <Button type="default" size="small" onClick={() => triggerStrategy(record._id)} disabled={record.phase === 'intake'}>2. Strategy</Button>
        </div>
      )
    }
  ];

  return (
    <Card className="seo-glass-panel seo-table">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>All Projects</Title>
        {!isViewOnly && canAdd && (
          <Button type="primary" icon={<Plus size={16} />} className="seo-glow-btn" onClick={onCreateProject}>New Project</Button>
        )}
      </div>
      <Table dataSource={projects} columns={columns} rowKey="_id" loading={loading} />
    </Card>
  );
};

export default ProjectsPanel;
