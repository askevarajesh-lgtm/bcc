import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Switch, Button, Tag, Avatar, message } from 'antd';
import { motion } from 'framer-motion';
import { Settings, ExternalLink, Link2, Search } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      setIntegrations(res.data.data);
    } catch (error) {
      message.error('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/integrations/${id}`, { status: !currentStatus });
      message.success(`Integration ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchIntegrations();
    } catch (error) {
      message.error('Failed to update integration status');
    }
  };

  // Group by category
  const categoriesMap = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {});

  const integrationCategories = Object.keys(categoriesMap).map(category => ({
    category,
    items: categoriesMap[category]
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
            Global Integrations
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage platform-wide API keys, third-party services, and core infrastructure integrations.
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<Search size={18} />} 
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', height: 44, borderRadius: 8, fontWeight: 600 }}
        >
          Browse App Directory
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {integrationCategories.length === 0 && !loading && (
          <Text type="secondary">No integrations found in the database.</Text>
        )}
        
        {integrationCategories.map((categoryGroup, idx) => (
          <div key={idx}>
            <Title level={4} style={{ marginBottom: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{categoryGroup.category}</Title>
            <Row gutter={[24, 24]}>
              {categoryGroup.items.map((integration, index) => (
                <Col xs={24} md={12} xl={8} key={integration._id}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx * 0.1) + (index * 0.05) }}>
                    <Card 
                      className="glassmorphism hover-lift"
                      style={{ 
                        borderRadius: 16, 
                        border: integration.status ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', 
                        background: 'var(--bg-secondary)',
                      }}
                      bodyStyle={{ padding: 24 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <Avatar 
                            size={48} 
                            style={{ 
                              background: integration.bg || integration.color || '#ccc', 
                              color: integration.bg ? integration.color : '#fff',
                              fontWeight: 800,
                              fontSize: 20,
                              borderRadius: 12
                            }}
                          >
                            {integration.icon || integration.name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                              {integration.name}
                            </Text>
                            <Tag color={integration.status ? 'green' : 'default'} style={{ borderRadius: 12 }}>
                              {integration.status ? 'Connected' : 'Disconnected'}
                            </Tag>
                          </div>
                        </div>
                        <Switch 
                          checked={integration.status} 
                          onChange={() => handleToggleStatus(integration._id, integration.status)}
                        />
                      </div>
                      
                      <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14, minHeight: 44 }}>
                        {integration.description}
                      </Text>

                      <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                        <Button type="text" icon={<Settings size={16} />} style={{ flex: 1, fontWeight: 600, color: 'var(--text-secondary)' }}>Configure</Button>
                        <Button type="text" icon={<ExternalLink size={16} />} style={{ flex: 1, fontWeight: 600, color: 'var(--text-secondary)' }}>Docs</Button>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
