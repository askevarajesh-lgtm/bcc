import React, { useState } from 'react';
import { Typography, Row, Col, Switch, Button, Tag, Spin } from 'antd';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Settings } from 'lucide-react';
import WebsiteConfigPage from '../../integrations/WebsiteConfigPage';
import { useGetIntegrationsQuery, useUpdateIntegrationMutation } from '../../../api/integrationApi';

const { Title, Text } = Typography;

const IntegrationCard = ({ title, description, icon: Icon, active, configured, buttonText, onConfigure, onToggle }) => {
  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent'
          }}>
            <Icon size={24} color="#fff" />
          </div>
          <Switch checked={active} onChange={onToggle} style={{ background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>
      
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Title level={5} style={{ margin: '0 0 16px 0', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</Title>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Tag style={{ borderRadius: 12, border: 'none', background: active ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)', color: active ? '#2563eb' : 'var(--text-tertiary)', fontWeight: 700, padding: '2px 10px', margin: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#2563eb' : 'var(--text-tertiary)', marginRight: 6 }}></div>
            {active ? 'Active' : 'Inactive'}
          </Tag>
          {configured && (
            <Tag style={{ borderRadius: 12, border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 700, padding: '2px 10px', margin: 0 }}>
              + Configured
            </Tag>
          )}
        </div>
        
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginBottom: 24, flex: 1, lineHeight: 1.6 }}>
          {description}
        </Text>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <Button onClick={onConfigure} type="primary" icon={<Settings size={14} />} style={{ background: '#1d4ed8', borderRadius: 8, fontWeight: 600, padding: '0 20px', border: 'none', height: 36 }}>
            {buttonText}
          </Button>
          <ArrowRight size={18} color="var(--text-tertiary)" />
        </div>
      </div>
    </div>
  );
};

const ClientIntegrationsTab = ({ user }) => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  const { data, refetch, isLoading } = useGetIntegrationsQuery();
  const [updateIntegration] = useUpdateIntegrationMutation();

  const integrations = data?.data?.integrations || [];
  const websiteIntegration = integrations.find((i) => i.type === "website");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const handleToggle = async (checked) => {
    try {
      if (websiteIntegration) {
        await updateIntegration({
          id: websiteIntegration._id,
          isActive: checked,
        }).unwrap();
      }
      refetch();
    } catch (error) {
      console.error("Failed to toggle integration", error);
    }
  };

  if (selectedConfig === 'website') {
    return <WebsiteConfigPage integrationId={websiteIntegration?._id || 'new'} onBack={() => { setSelectedConfig(null); refetch(); }} />;
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  const isActive = websiteIntegration?.isActive || false;
  const isConfigured = Boolean(websiteIntegration?.config && Object.keys(websiteIntegration.config).length > 0);
  const hasCrmLeads = user?.features?.includes('crm');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ padding: '0' }}>
      <Row gutter={[24, 24]}>
        {hasCrmLeads ? (
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={itemVariants} style={{ height: '100%' }}>
              <IntegrationCard 
                title="Lead Management Integration" 
                description="Configure and manage lead integrations from Website forms and WhatsApp" 
                icon={Globe} 
                active={isActive} 
                configured={isConfigured} 
                buttonText="Configure" 
                onConfigure={() => setSelectedConfig('website')}
                onToggle={handleToggle}
              />
            </motion.div>
          </Col>
        ) : (
          <Col span={24}>
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No integrations available for your current modules.
            </div>
          </Col>
        )}
      </Row>
    </motion.div>
  );
};

export default ClientIntegrationsTab;
