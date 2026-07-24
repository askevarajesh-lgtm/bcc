import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Select, Spin, message, Input } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, AlertCircle, FileText, PenTool, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import AIStudioTab from './tabs/AIStudioTab';
import IntakeTab from './tabs/IntakeTab';
import QATab from './tabs/QATab';
import ListViewTab from './tabs/ListViewTab';
import CalendarViewTab from './tabs/CalendarViewTab';
import { contentApi } from '../../api/contentApi';
import { useContentModule } from './ContentModuleContext';
import { useActionPermissions } from '../../hooks/useActionPermissions';

const { Title, Text } = Typography;

const Content = () => {
  const { refreshToken } = useContentModule();
  const { canAdd, canView } = useActionPermissions('/content');
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(true);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyStatusLoading, setKeyStatusLoading] = useState(true);

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      try {
        setKeyStatusLoading(true);
        const response = await contentApi.getSettings();
        if (response.success) {
          setIsApiKeyConfigured(response.data.isAnthropicConfigured);
        }
      } catch (error) {
        console.error('Failed to fetch API key status', error);
      } finally {
        setKeyStatusLoading(false);
      }
    };
    checkApiKeyStatus();
  }, []);

  const handleSaveApiKey = async () => {
    if (!tempApiKey.trim()) {
      message.error("Please enter a valid API Key.");
      return;
    }
    try {
      setIsSavingKey(true);
      const payload = { anthropicApiKey: tempApiKey };
      const response = await contentApi.saveSettings(payload);
      if (response.success) {
        message.success('API Key saved securely!');
        setIsApiKeyConfigured(true);
      }
    } catch (error) {
      console.error('Failed to save API key', error);
      message.error('Failed to save API Key');
    } finally {
      setIsSavingKey(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await contentApi.getItems();
        if (res.success) {
          setItems(res.data.items || []);
        }
      } catch (error) {
        console.error('Failed to load content items for stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshToken]);

  const handleExport = async () => {
    try {
      message.loading({ content: 'Packaging assets...', key: 'export' });
      const blob = await contentApi.exportItems();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'content-delivery.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success({ content: 'Export downloaded successfully!', key: 'export' });
    } catch (e) {
      console.error(e);
      message.error({ content: 'Failed to export or no approved items found.', key: 'export' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <IntakeTab itemVariants={itemVariants} />;
      case 1: return <CalendarViewTab itemVariants={itemVariants} />;
      case 2: return <AIStudioTab itemVariants={itemVariants} />;
      case 3: return <QATab itemVariants={itemVariants} />;
      case 4: return <ListViewTab itemVariants={itemVariants} />;
      default: return <IntakeTab itemVariants={itemVariants} />;
    }
  };

  const publishedCount = items.filter(i => i.status === 'Published' || i.status === 'Approved').length;
  const reviewCount = items.filter(i => i.status === 'Draft' || i.status === 'In Review').length;
  const scheduledCount = items.filter(i => i.status === 'Scheduled').length;
  const totalCount = items.length;

  if (keyStatusLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!isApiKeyConfigured) {
    return (
      <div style={{ padding: 60, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <Card className="glassmorphism" style={{ borderRadius: 16 }}>
          <SettingsIcon size={48} style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
          <Title level={2} style={{ margin: '0 0 16px 0', fontWeight: 800 }}>Action Required</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 16 }}>
            Please configure your Claude API Key before using the Content Workspace. Your key is encrypted and stored securely.
          </Text>
          <Input.Password 
            placeholder="sk-ant-..." 
            value={tempApiKey} 
            onChange={e => setTempApiKey(e.target.value)} 
            size="large"
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Button 
            type="primary" 
            size="large" 
            loading={isSavingKey} 
            onClick={handleSaveApiKey}
            style={{ width: '100%', borderRadius: 8, height: 48, fontWeight: 600 }}
          >
            Save API Key & Enable Features
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Content Pipeline</Title>
          <Text type="secondary">End-to-end AI workflow from intake and planning to QA and delivery.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {canView && (
            <Button type="primary" onClick={handleExport} icon={<Download size={16} />} style={{ borderRadius: 8, height: 40, background: 'var(--accent-secondary)', border: 'none', boxShadow: 'var(--shadow-md)', fontWeight: 600 }}>Export Pipeline</Button>
          )}
        </div>
      </motion.div>

      {/* GRADIENT STROKE CARDS WITH FLOATING BADGE */}
      <Spin spinning={loading}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24, paddingTop: 16 }}>
          {[
            { label: 'PUBLISHED THIS MONTH', val: publishedCount, sub: 'Pieces shipped', colorStart: '#3b82f6', colorEnd: '#10b981', icon: <CheckCircle2 size={20} /> },
            { label: 'PENDING QA APPROVAL', val: reviewCount, sub: 'Awaiting Gate 2', colorStart: '#f59e0b', colorEnd: '#ef4444', icon: <AlertCircle size={20} /> },
            { label: 'SCHEDULED', val: scheduledCount, sub: 'Queued for go-live', colorStart: '#8b5cf6', colorEnd: '#3b82f6', icon: <PenTool size={20} /> },
            { label: 'TOTAL PIPELINE', val: totalCount, sub: 'All statuses', colorStart: '#0d9488', colorEnd: '#0ea5e9', icon: <FileText size={20} /> }
          ].map((kpi, i) => (
            <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
              <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                <div style={{ position: 'relative', height: '100%', paddingTop: 20 }}>
                  {/* Floating Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 24,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${kpi.colorStart}, ${kpi.colorEnd})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 2
                  }}>
                    {kpi.icon}
                  </div>

                  {/* Gradient Border Card Wrapper */}
                  <div style={{
                    padding: 2,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${kpi.colorStart}, transparent, transparent, ${kpi.colorEnd})`,
                    height: 'calc(100% - 20px)'
                  }}>
                    <Card
                      bodyStyle={{ padding: '28px 20px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}
                      style={{
                        borderRadius: 14,
                        height: '100%',
                        background: 'var(--bg-primary)',
                        border: 'none',
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{kpi.label}</Text>
                      <Title level={2} style={{ margin: '8px 0 4px', color: 'var(--text-primary)', fontSize: 36, fontWeight: 800 }}>{kpi.val}</Title>
                      <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 'auto' }}>{kpi.sub}</Text>
                    </Card>
                  </div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Spin>

      {reviewCount > 0 && (
        <motion.div variants={itemVariants}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            padding: 20,
            borderRadius: 16,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', color: 'var(--accent-warning)' }}>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <AlertCircle size={24} style={{ marginTop: 2 }} />
              </motion.div>
              <span>
                <strong style={{ fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>{reviewCount} content pieces await QA Gate 2</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Review and approve content to unlock final delivery.</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button type="primary" onClick={() => setActiveTab(3)} style={{ background: 'var(--accent-warning)', border: 'none', color: '#fff', borderRadius: 8, fontWeight: 600 }}>Review Now</Button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', paddingBottom: 2 }}>
          {['1. Intake & Research', '2. Calendar Planning', '3. Content Studio', '4. QA & Delivery', 'All Items'].map((tab, i) => (
            <div
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                paddingBottom: 12,
                borderBottom: activeTab === i ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div key={activeTab} variants={containerVariants} initial="hidden" animate="visible">
        {renderTabContent()}
      </motion.div>

    </motion.div>
  );
};

export { Content };

import { ContentModuleProvider } from './ContentModuleContext';

const ContentWrapper = () => (
  <ContentModuleProvider>
    <Content />
  </ContentModuleProvider>
);

export default ContentWrapper;
