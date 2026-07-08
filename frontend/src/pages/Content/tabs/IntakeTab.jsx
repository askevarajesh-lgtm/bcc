import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Input, Select, Divider, message, Spin } from 'antd';
import { motion } from 'framer-motion';
import { Search, MapPin, Target, FileText, Settings, Database, AlertCircle } from 'lucide-react';
import { contentApi } from '../../../api/contentApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const IntakeTab = ({ itemVariants }) => {
  const [loading, setLoading] = useState(false);
  const [checkingIntegration, setCheckingIntegration] = useState(true);
  const [formData, setFormData] = useState({
    specialty: '',
    location: '',
    audience: '',
    brandVoice: 'Professional, Empathetic, Trustworthy',
    complianceFramework: 'FTC Guidelines & General Advertising Laws'
  });
  const [gscConnected, setGscConnected] = useState(false);
  const [ga4Connected, setGa4Connected] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await contentApi.getIntegrationStatus();
        if (res.success) {
          setGscConnected(res.data.gscConnected);
          setGa4Connected(res.data.ga4Connected);
        }
      } catch (err) {
        console.error('Failed to fetch integration status');
      } finally {
        setCheckingIntegration(false);
      }
    };
    fetchStatus();
  }, []);

  const handleConnect = (service) => {
    message.warning({ content: `${service} requires backend configuration. Please configure process.env credentials in the server environment.`, key: 'connect', duration: 4 });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRunResearch = async () => {
    setLoading(true);
    message.loading({ content: 'Running Content Intake & Research agents...', key: 'research' });
    try {
      // Simulate calling the content-intake and content-researcher agents
      const res = await contentApi.generateContent({
        topic: `Research for ${formData.specialty} in ${formData.location}`,
        contentType: 'content-researcher',
        tone: formData.brandVoice
      });
      if (res.success) {
        message.success({ content: 'Research complete! Target keywords and opportunity map generated.', key: 'research' });
      } else {
        message.error({ content: 'Failed to run research', key: 'research' });
      }
    } catch (error) {
      message.error({ content: 'Error connecting to AI agents', key: 'research' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={itemVariants} style={{ paddingTop: 12 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
            bodyStyle={{ padding: 24 }}
            className="glassmorphism hover-bg"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 12, color: 'var(--accent-primary)' }}>
                <Target size={24} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0 }}>Client Brief & Intake</Title>
                <Text type="secondary">Define the core parameters for the AI agents.</Text>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Practice Specialty / Focus Area</Text>
                <Input 
                  size="large" 
                  placeholder="e.g. Multispecialty Hospital, Dental Clinic, Cardiology..." 
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  style={{ borderRadius: 8, background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
              </Col>
              
              <Col xs={24} md={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Primary Market / Location</Text>
                <Input 
                  size="large" 
                  prefix={<MapPin size={16} color="var(--text-tertiary)" />} 
                  placeholder="e.g. Bangalore, India" 
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  style={{ borderRadius: 8, background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
              </Col>
              
              <Col xs={24} md={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Target Audience Profile</Text>
                <Input 
                  size="large" 
                  placeholder="e.g. Working professionals, 30-50" 
                  value={formData.audience}
                  onChange={(e) => handleChange('audience', e.target.value)}
                  style={{ borderRadius: 8, background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
              </Col>
              
              <Col span={24}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Brand Voice</Text>
                <TextArea 
                  rows={2} 
                  value={formData.brandVoice}
                  onChange={(e) => handleChange('brandVoice', e.target.value)}
                  style={{ borderRadius: 8, background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                />
              </Col>

              <Col span={24}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Compliance Frameworks</Text>
                <Select 
                  mode="tags"
                  style={{ width: '100%' }}
                  size="large"
                  value={[formData.complianceFramework]}
                  onChange={(val) => handleChange('complianceFramework', val.join(', '))}
                  options={[
                    { value: 'FTC Guidelines', label: 'FTC Guidelines' },
                    { value: 'GDPR / Data Privacy', label: 'GDPR / Data Privacy' },
                    { value: 'RERA Guidelines (Real Estate)', label: 'RERA Guidelines (Real Estate)' },
                    { value: 'Fair Housing Act', label: 'Fair Housing Act' },
                    { value: 'HIPAA (Healthcare)', label: 'HIPAA (Healthcare)' },
                    { value: 'MoHFW Guidelines', label: 'MoHFW Guidelines' },
                  ]}
                />
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="primary" 
                size="large"
                loading={loading}
                onClick={handleRunResearch}
                icon={<Search size={18} />}
                style={{ borderRadius: 8, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-info))', border: 'none', fontWeight: 600, boxShadow: 'var(--shadow-glow)' }}
              >
                Run AI Research & Trends
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', height: '100%' }}
            bodyStyle={{ padding: 24 }}
            className="glassmorphism"
          >
            <Title level={4} style={{ marginBottom: 16 }}>Data Integrations</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Optional data sources for the <code>content-researcher</code> agent to map trends and seasonality.
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Database size={20} color="var(--accent-primary)" />
                    <Text strong>DataForSEO</Text>
                  </div>
                  <Text type="success" strong style={{ fontSize: 12 }}>Connected</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>Powers keyword data, SERP analysis, and trend signals.</Text>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Search size={20} color="var(--accent-info)" />
                    <Text strong>Google Search Console</Text>
                  </div>
                  {checkingIntegration ? <Spin size="small" /> : gscConnected ? (
                    <Text type="success" strong style={{ fontSize: 12 }}>Connected</Text>
                  ) : (
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => handleConnect('Google Search Console')}>Connect</Button>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>Grounds research in real query patterns.</Text>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Settings size={20} color="var(--accent-warning)" />
                    <Text strong>Google Analytics 4</Text>
                  </div>
                  {checkingIntegration ? <Spin size="small" /> : ga4Connected ? (
                    <Text type="success" strong style={{ fontSize: 12 }}>Connected</Text>
                  ) : (
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => handleConnect('Google Analytics 4')}>Connect</Button>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>Audience demographics and engagement data.</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default IntakeTab;
