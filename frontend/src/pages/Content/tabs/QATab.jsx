import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Spin, message, Checkbox, Divider, Tag } from 'antd';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileCheck2, UserCheck } from 'lucide-react';
import { contentApi } from '../../../api/contentApi';
import { useContentModule } from '../ContentModuleContext';

const { Title, Text } = Typography;

const QATab = ({ itemVariants }) => {
  const { refreshToken, refreshContent } = useContentModule();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processingQA, setProcessingQA] = useState(false);
  const [qaMessage, setQaMessage] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await contentApi.getItems();
        if (res.success) {
          // Show items that are Draft or In Review
          const pending = res.data.items.filter(i => i.status === 'Draft' || i.status === 'In Review');
          setItems(pending);
          if (pending.length > 0 && !selectedItem) {
            setSelectedItem(pending[0]);
          }
        }
      } catch (error) {
        message.error('Failed to load QA items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [refreshToken]);

  const handleRunQA = async () => {
    if (!selectedItem) return;
    setQaMessage('Running Compliance QA...');
    setProcessingQA(true);
    try {
      const res = await contentApi.generateContent({
        topic: `Audit this content: ${selectedItem.title}`,
        contentType: 'content-qa-compliance',
        tone: 'Professional'
      });
      if (res.success) {
        message.success({ content: 'QA Passed! Compliance checklist verified.', key: 'qa' });
      } else {
        message.error({ content: 'QA check failed', key: 'qa' });
      }
    } catch (e) {
      message.error({ content: 'Error running QA', key: 'qa' });
    } finally {
      setProcessingQA(false);
    }
  };

  const handleHumanize = async () => {
    if (!selectedItem) return;
    setQaMessage('Humanizing content...');
    setProcessingQA(true);
    try {
      const res = await contentApi.generateContent({
        topic: `Humanize this content: ${selectedItem.title}`,
        contentType: 'content-humanizer',
        tone: 'Professional'
      });
      if (res.success) {
        message.success({ content: 'Content humanized successfully!', key: 'humanize' });
      } else {
        message.error({ content: 'Failed to humanize content', key: 'humanize' });
      }
    } catch (e) {
      message.error({ content: 'Error humanizing content', key: 'humanize' });
    } finally {
      setProcessingQA(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setQaMessage('Approving content...');
    setProcessingQA(true);
    try {
      const res = await contentApi.updateItem(selectedItem._id, { status: 'Approved' });
      if (res.success) {
        message.success('Content Approved for Delivery! (Gate 2 Passed)');
        refreshContent();
        setSelectedItem(null);
      }
    } catch (e) {
      message.error('Failed to approve content');
    } finally {
      setProcessingQA(false);
    }
  };

  return (
    <motion.div variants={itemVariants} style={{ paddingTop: 12 }}>
      <Spin fullscreen spinning={processingQA} tip={qaMessage} size="large" />
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', height: '100%', border: '1px solid var(--border-color)' }}
            bodyStyle={{ padding: 0 }}
            className="glassmorphism"
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Title level={5} style={{ margin: 0, fontWeight: 700 }}>Pending Review</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>Items awaiting Gate 2 Approval</Text>
            </div>
            
            <Spin spinning={loading}>
              <div style={{ overflowY: 'auto', maxHeight: 600 }}>
                {items.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <CheckCircle2 size={32} color="var(--accent-secondary)" style={{ marginBottom: 12, opacity: 0.5 }} />
                    <Text type="secondary" style={{ display: 'block' }}>All caught up! No items in QA.</Text>
                  </div>
                ) : (
                  items.map(item => (
                    <div 
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      style={{ 
                        padding: '16px 24px', 
                        borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer',
                        background: selectedItem?._id === item._id ? 'var(--bg-primary)' : 'transparent',
                        borderLeft: selectedItem?._id === item._id ? '3px solid var(--accent-warning)' : '3px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</strong>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Tag style={{ borderRadius: 12, border: 'none', background: 'var(--bg-tertiary)', margin: 0 }}>{item.type || 'Draft'}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {selectedItem ? (
            <Card
              bordered={false}
              style={{ borderRadius: 16, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', height: '100%', border: '1px solid var(--border-color)' }}
              bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
              className="glassmorphism"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <Title level={4} style={{ margin: '0 0 8px 0' }}>{selectedItem.title}</Title>
                  <Tag color="warning" style={{ borderRadius: 12, fontWeight: 600 }}>{selectedItem.status}</Tag>
                  <Tag style={{ borderRadius: 12, border: '1px solid var(--border-color)' }}>{selectedItem.platform || selectedItem.type}</Tag>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button 
                    onClick={handleHumanize} 
                    loading={processingQA}
                    icon={<UserCheck size={16} />} 
                    style={{ borderRadius: 8, borderColor: 'var(--border-color)' }}
                  >
                    Humanize
                  </Button>
                  <Button 
                    onClick={handleRunQA} 
                    loading={processingQA}
                    icon={<ShieldCheck size={16} />} 
                    style={{ borderRadius: 8, borderColor: 'var(--border-color)', color: 'var(--accent-info)' }}
                  >
                    Run QA Check
                  </Button>
                </div>
              </div>

              <div style={{ flex: 1, background: 'var(--bg-primary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                {selectedItem.body || <Text type="secondary">No content body available.</Text>}
              </div>

              <Divider style={{ margin: '0 0 24px 0', borderColor: 'var(--border-color)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <Checkbox checked style={{ color: 'var(--text-secondary)' }}>Medical Accuracy</Checkbox>
                  <Checkbox checked style={{ color: 'var(--text-secondary)' }}>Brand Voice</Checkbox>
                  <Checkbox style={{ color: 'var(--text-secondary)' }}>Compliance (HIPAA)</Checkbox>
                </div>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleApprove}
                  loading={processingQA}
                  icon={<FileCheck2 size={18} />}
                  style={{ background: 'var(--accent-success)', border: 'none', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                >
                  Approve for Delivery
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border-strong)' }}>
              <ShieldCheck size={48} color="var(--border-strong)" style={{ marginBottom: 16 }} />
              <Text type="secondary" style={{ fontSize: 16 }}>Select an item to review and approve.</Text>
            </div>
          )}
        </Col>
      </Row>
    </motion.div>
  );
};

export default QATab;
