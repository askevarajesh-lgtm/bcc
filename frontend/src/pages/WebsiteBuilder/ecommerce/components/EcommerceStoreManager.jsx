import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, List, Space, message, Spin } from 'antd';
import { LayoutTemplate, Eye, Edit2, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplates } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;

const EcommerceStoreManager = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { workspaceId, websiteId } = useEcommerce();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId && websiteId && templateId) {
      loadTemplate();
    }
  }, [workspaceId, websiteId, templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const templates = await getTemplates(workspaceId, websiteId);
      if (templates[templateId]) {
        setTemplate(templates[templateId]);
      } else {
        message.error("Store not found");
        navigate('../templates');
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!template) return null;

  const pagesList = template.pages ? Object.values(template.pages) : [];

  return (
    <div style={{ padding: '24px' }}>
      <Button 
        type="link" 
        icon={<ChevronLeft size={16} />} 
        onClick={() => navigate('../templates')}
        style={{ padding: 0, marginBottom: 16 }}
      >
        Back to Store Library
      </Button>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutTemplate size={24} color="var(--accent-primary)" /> {template.name}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              Store Management • Last Updated: {new Date(template.updatedAt || template.createdAt).toLocaleDateString()}
            </Text>
          </div>
          <Space>
            <Button onClick={() => navigate(`../preview/${templateId}`)}>Preview Store</Button>
            <Button>Edit Store Name</Button>
          </Space>
        </div>
      </Card>

      <Card title={<Title level={4} style={{ margin: 0 }}>Pages</Title>}>
        <List
          dataSource={pagesList}
          renderItem={page => (
            <List.Item
              actions={[
                <Button key="preview" icon={<Eye size={14} />} onClick={() => navigate(`../preview/${templateId}?page=${page.id}`)}>
                  Preview
                </Button>,
                <Button key="edit" type="primary" icon={<Edit2 size={14} />} onClick={() => navigate(`../builder/${templateId}/${page.id}`)}>
                  Edit
                </Button>
              ]}
            >
              <List.Item.Meta
                title={page.name}
                description={page.id}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default EcommerceStoreManager;
