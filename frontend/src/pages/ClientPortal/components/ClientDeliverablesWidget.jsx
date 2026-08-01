import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Row, Col, Tag, Spin, Empty } from 'antd';
import { motion } from 'framer-motion';
import { Download, Eye, Image as ImageIcon } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../../services/api';

const { Title, Text } = Typography;

const ClientDeliverablesWidget = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/deliverables');
      if (res.data.success) {
        // Filter to show only items with assetUrl (AI Assets) or all deliverables
        const allDeliverables = res.data.data.deliverables || res.data.data;
        const assets = allDeliverables.filter(d => d.assetUrl);
        setDeliverables(assets);
      }
    } catch (error) {
      console.error('Error fetching client deliverables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>AI Studio Deliverables</Title>
      </div>
      
      {loading ? (
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Card>
      ) : deliverables.length === 0 ? (
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <Empty description={<span style={{ color: 'var(--text-secondary)' }}>No AI assets available</span>} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {deliverables.slice(0, 4).map((item) => (
            <Col xs={24} sm={12} lg={6} key={item._id}>
              <Card 
                className="glassmorphism"
                hoverable
                cover={
                  <div style={{ height: 160, overflow: 'hidden', position: 'relative', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.assetUrl ? (
                      <img alt={item.title} src={item.assetUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={48} color="var(--text-secondary)" opacity={0.5} />
                    )}
                  </div>
                }
                bodyStyle={{ padding: '16px' }}
                style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Text style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }} ellipsis={{ tooltip: item.title }}>{item.title}</Text>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Tag style={{ margin: 0, borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                      {item.deliverableType ? item.deliverableType.replace(/_/g, ' ').toUpperCase() : 'ASSET'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.dueDate).format('MMM D')}</Text>
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <Button 
                      type="primary" 
                      icon={<Download size={14} />} 
                      style={{ flex: 1, borderRadius: 8, background: 'var(--accent-primary)' }}
                      onClick={() => {
                        if (item.assetUrl) {
                          const link = document.createElement('a');
                          link.href = item.assetUrl;
                          // Use the item title for the filename, fallback to 'ai_asset'
                          const filename = item.title ? item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'ai_asset';
                          link.download = `${filename}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </motion.div>
  );
};

export default ClientDeliverablesWidget;
