import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Table, Space, Tag, Popconfirm, message } from 'antd';
import { LayoutTemplate, Edit, Trash2, Eye } from 'lucide-react';
import { getStorageData, setStorageData } from '../utils/storage';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const EcommerceTemplates = () => {
  const [templates, setTemplates] = useState({});
  const navigate = useNavigate();
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const data = getStorageData(workspaceId, websiteId, 'templates', {});
    setTemplates(data);
  };

  const handleDelete = (id) => {
    const updated = { ...templates };
    delete updated[id];
    setStorageData(workspaceId, websiteId, 'templates', updated);
    setTemplates(updated);
    message.success('Template deleted');
  };

  const columns = [
    {
      title: 'Template ID',
      dataIndex: 'id',
      key: 'id',
      render: text => <Text strong>{text}</Text>,
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
            icon={<Edit size={14} />} 
            onClick={() => navigate(`../builder`)} // In a real app, this would load the specific template ID into the builder
          >
            Edit
          </Button>
          <Button 
            size="small" 
            type="primary"
            icon={<Eye size={14} />} 
            onClick={() => navigate(`../preview/${record.id}`)} 
          >
            Preview
          </Button>
          <Popconfirm title="Delete template?" onConfirm={() => handleDelete(record.id)}>
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
            <LayoutTemplate size={24} color="var(--accent-primary)" /> Saved Templates
          </Title>
          <Text type="secondary">Manage your uploaded e-commerce template ZIPs</Text>
        </div>
        <Button type="primary" onClick={() => navigate('../builder')}>Upload New ZIP</Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={dataSource}
          pagination={false}
          locale={{ emptyText: 'No templates uploaded yet. Go to Store Builder to upload a ZIP.' }}
        />
      </Card>
    </div>
  );
};

export default EcommerceTemplates;
