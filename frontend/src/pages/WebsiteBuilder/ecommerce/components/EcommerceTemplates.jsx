import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Table, Space, Tag, Popconfirm, message } from 'antd';
import { LayoutTemplate, Edit, Trash2, Eye } from 'lucide-react';
import { getTemplates, deleteTemplate } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;

const EcommerceTemplates = () => {
  const [templates, setTemplates] = useState({});
  const navigate = useNavigate();
  const { workspaceId, websiteId, changeTemplate } = useEcommerce();

  useEffect(() => {
    loadTemplates();
  }, [workspaceId, websiteId]);

  const loadTemplates = async () => {
    if (!workspaceId || !websiteId) return;
    const data = await getTemplates(workspaceId, websiteId);
    setTemplates(data);
  };

  const handleDelete = async (id) => {
    await deleteTemplate(workspaceId, websiteId, id);
    const updated = { ...templates };
    delete updated[id];
    setTemplates(updated);
    message.success('Store deleted');
  };

  const columns = [
    {
      title: 'Store Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || record.id}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </Space>
      ),
    },
    {
      title: 'Pages Detected',
      key: 'pages',
      render: (_, record) => (
        <Space wrap>
          {record.pages ? Object.values(record.pages).map(p => (
            <Tag color="blue" key={p.id}>{p.name}</Tag>
          )) : <Text type="secondary">Legacy Format</Text>}
        </Space>
      )
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: text => new Date(text).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<Eye size={14} />}
            onClick={() => {
              changeTemplate(record.id);
              navigate('../dashboard');
            }}
          >
            Manage
          </Button>
          <Popconfirm title="Delete store?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const dataSource = Object.values(templates).map(t => ({ ...t, key: t.id || 'legacy' }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutTemplate size={24} color="var(--accent-primary)" /> Saved Stores
          </Title>
          <Text type="secondary">Manage your saved e-commerce stores</Text>
        </div>
        <Button type="primary" onClick={() => navigate('../builder')}>Upload New ZIP</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          locale={{ emptyText: 'No stores saved yet. Go to Store Builder to upload a ZIP.' }}
        />
      </Card>
    </div>
  );
};

export default EcommerceTemplates;
