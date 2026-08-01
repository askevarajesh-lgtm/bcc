import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, message, Popconfirm } from 'antd';
import { Edit2, Play, Copy, Trash2, Power } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';

export default function WorkflowsList({ projectId, onEdit }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  const fetchWorkflows = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await seoWorkspaceApi.getAutomationWorkflows(projectId);
      setWorkflows(res.data || []);
    } catch (error) {
      message.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id) => {
    try {
      await seoWorkspaceApi.runAutomationWorkflow(projectId, id);
      message.success('Workflow executed');
    } catch (error) {
      message.error('Execution failed');
    }
  };

  const handleClone = async (id) => {
    try {
      await seoWorkspaceApi.cloneAutomationWorkflow(projectId, id);
      message.success('Workflow cloned');
      fetchWorkflows();
    } catch (error) {
      message.error('Clone failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await seoWorkspaceApi.deleteAutomationWorkflow(projectId, id);
      message.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      message.error('Delete failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t, r) => <b>{t}</b> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: t => <Tag>{t}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Published' ? 'blue' : 'default'}>{s}</Tag> },
    { title: 'Last Run', dataIndex: 'lastRun', key: 'lastRun', render: () => 'Never' }, // Placeholder
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Play size={16} />} onClick={() => handleRun(record._id)} />
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => onEdit(record._id)} />
          <Button type="text" icon={<Copy size={16} />} onClick={() => handleClone(record._id)} />
          <Popconfirm title="Delete this workflow?" onConfirm={() => handleDelete(record._id)}>
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={() => onEdit('new')}>Create Workflow</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={workflows} 
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
}
