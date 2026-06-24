import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Tag, Row, Col, Drawer, Tabs, Progress, Switch, Select, message, Modal, Form } from 'antd';
import { Search, AlertTriangle, CheckCircle, ExternalLink, MoreHorizontal, Circle, ArrowUpRight, Shield, Zap, Globe, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import SlabCard from '../../../components/SlabCard';
import { useFeatures } from '../../../contexts/FeatureContext';

const { Title, Text } = Typography;

const ClientsTab = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbClients, setDbClients] = useState([]);
  const [form] = Form.useForm();
  
  const { getClientData, updateClientFeatures, packages, createPackage, updatePackage } = useFeatures();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brands', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setDbClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const [isPackagesDrawerOpen, setIsPackagesDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm] = Form.useForm();

  const handleCreateClient = async (values) => {
    try {
      setLoading(true);

      let selectedPackage = null;
      if (values.packageName) {
        selectedPackage = packages.find(p => p.name === values.packageName);
      }

      const payload = {
        ...values,
        features: selectedPackage ? selectedPackage.features : []
      };

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        message.success('Client created successfully');
        setIsCreateModalOpen(false);
        form.resetFields();
        fetchClients();
      } else {
        message.error(data.message || 'Failed to create client');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackage = (values) => {
    const payload = {
      name: values.name,
      price: values.price || '',
      features: values.features || []
    };

    if (editingPackage) {
      updatePackage(editingPackage.id || editingPackage.name, payload);
      message.success(`Package ${payload.name} updated successfully`);
    } else {
      createPackage(payload);
      message.success(`Package ${payload.name} created successfully`);
    }
    setIsPackagesDrawerOpen(false);
    setEditingPackage(null);
    packageForm.resetFields();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const clients = [
    { id: 'pe', code: 'PE', name: 'Prestige Estates', industry: 'Real Estate', mos: 84, status: 'Healthy', scores: { SEO: 91, ADS: 86, LEADS: 83, SOCIAL: 70, WEB: 88, GEO: 72 }, am: 'Arjun Sharma', retainer: '₹3.8L/mo', sla: '98%', activity: '2h ago' },
    { id: 'bt', code: 'BT', name: 'boAt', industry: 'Consumer Electronics', mos: 81, status: 'Healthy', scores: { SEO: 78, ADS: 84, LEADS: 70, SOCIAL: 88, WEB: 82, GEO: 84 }, am: 'Priya Nair', retainer: '₹4.2L/mo', sla: '96%', activity: '2h ago' },
    { id: 'rp', code: 'RP', name: 'Rapido', industry: 'Mobility', mos: 78, status: 'Healthy', scores: { SEO: 74, ADS: 70, LEADS: 81, SOCIAL: 82, WEB: 76, GEO: 58 }, am: 'Rahul Singh', retainer: '₹3.5L/mo', sla: '94%', activity: '2h ago' },
    { id: 'ny', code: 'NY', name: 'Nykaa', industry: 'Beauty & Personal Care', mos: 76, status: 'Healthy', scores: { SEO: 72, ADS: 74, LEADS: 77, SOCIAL: 86, WEB: 70, GEO: 52 }, am: 'Priya Nair', retainer: '₹4.0L/mo', sla: '95%', activity: '2h ago' },
    { id: 'cr', code: 'CR', name: 'CRED', industry: 'Fintech', mos: 73, status: 'Healthy', scores: { SEO: 76, ADS: 72, LEADS: 74, SOCIAL: 70, WEB: 74, GEO: 60 }, am: 'Arjun Sharma', retainer: '₹4.6L/mo', sla: '97%', activity: '2h ago' },
    { id: 'me', code: 'ME', name: 'Meesho', industry: 'E-Commerce', mos: 71, status: 'Healthy', scores: { SEO: 68, ADS: 72, LEADS: 76, SOCIAL: 74, WEB: 72, GEO: 58 }, am: 'Karan Mehta', retainer: '₹3.4L/mo', sla: '92%', activity: '2h ago' },
    { id: 'zp', code: 'ZP', name: 'Zepto', industry: 'Quick Commerce', mos: 67, status: 'At Risk', scores: { SEO: 64, ADS: 68, LEADS: 72, SOCIAL: 71, WEB: 65, GEO: 48 }, am: 'Rahul Singh', retainer: '₹3.0L/mo', sla: '90%', activity: '2h ago' },
    { id: 'lk', code: 'LK', name: 'Lenskart', industry: 'Eyewear', mos: 63, status: 'At Risk', scores: { SEO: 62, ADS: 58, LEADS: 68, SOCIAL: 68, WEB: 61, GEO: 44 }, am: 'Karan Mehta', retainer: '₹2.8L/mo', sla: '84%', activity: '2h ago' },
    { id: 'oy', code: 'OY', name: 'OYO', industry: 'Hospitality', mos: 62, status: 'At Risk', scores: { SEO: 58, ADS: 63, LEADS: 61, SOCIAL: 64, WEB: 60, GEO: 42 }, am: 'Divya Rao', retainer: '₹3.2L/mo', sla: '89%', activity: '2h ago' },
    { id: 'bp', code: 'BP', name: 'BharatPe', industry: 'Fintech', mos: 58, status: 'At Risk', scores: { SEO: 60, ADS: 48, LEADS: 62, SOCIAL: 54, WEB: 56, GEO: 38 }, am: 'Priya Nair', retainer: '₹3.6L/mo', sla: '86%', activity: '2h ago' },
    { id: 'uc', code: 'UC', name: 'Urban Company', industry: 'Services', mos: 55, status: 'At Risk', scores: { SEO: 52, ADS: 54, LEADS: 58, SOCIAL: 56, WEB: 58, GEO: 38 }, am: 'Arjun Sharma', retainer: '₹2.6L/mo', sla: '82%', activity: '2h ago' },
    { id: 'wk', code: 'WF', name: 'Wakefit', industry: 'D2C / Sleep', mos: 49, status: 'Critical', scores: { SEO: 42, ADS: 46, LEADS: 48, SOCIAL: 52, WEB: 44, GEO: 32 }, am: 'Arjun Sharma', retainer: '₹2.4L/mo', sla: '76%', activity: '2h ago' }
  ];

  const getStatusColor = (status) => {
    if (status === 'Healthy') return 'var(--accent-primary)';
    if (status === 'At Risk') return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  const getScoreColor = (val) => {
    if (val >= 70) return 'var(--accent-primary)';
    if (val >= 50) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  const ScoreBar = ({ label, score }) => (
    <div style={{ flex: '1 1 80px', minWidth: 80, maxWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: getScoreColor(score) }}>{score}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: '100%', background: getScoreColor(score), borderRadius: 3 }} 
        />
      </div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>All Clients</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
            {clients.length + dbClients.length} active · <span style={{color: 'var(--accent-primary)'}}>6 healthy</span> · <span style={{color: 'var(--accent-warning)'}}>5 at risk</span> · <span style={{color: 'var(--accent-danger)'}}>1 critical</span>
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            onClick={() => setIsPackagesDrawerOpen(true)}
            style={{ fontWeight: 700, borderRadius: 8, height: 40, borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Manage Packages
          </Button>
          <Button 
            type="primary" 
            onClick={() => setIsCreateModalOpen(true)}
            style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, height: 40 }}
          >
            + Create Client
          </Button>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: 12, borderRadius: 16, border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 16 }}>
          
          <Input 
            prefix={<Search size={18} style={{ color: 'var(--text-tertiary)' }} />} 
            placeholder="Search clients..." 
            style={{ 
              maxWidth: 300, 
              background: 'transparent', 
              border: 'none', 
              boxShadow: 'none',
              fontSize: 15
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Status Filters */}
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 4, borderRadius: 12 }}>
              <Button type="text" style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, padding: '4px 16px', height: 32 }}>All</Button>
              <Button type="text" style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 16px', height: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                Healthy <CheckCircle size={14} color="var(--accent-primary)" />
              </Button>
              <Button type="text" style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 16px', height: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                At Risk <AlertTriangle size={14} color="var(--accent-warning)" />
              </Button>
              <Button type="text" style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 16px', height: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                Critical <Circle size={14} fill="var(--accent-danger)" color="var(--accent-danger)" />
              </Button>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 8px' }} />

            {/* AM Filters */}
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 4, borderRadius: 12 }}>
              <Button type="text" style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, padding: '4px 16px', height: 32 }}>All AMs</Button>
              {['Arjun', 'Priya', 'Karan', 'Divya', 'Rahul'].map(am => (
                <Button key={am} type="text" style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 16px', height: 32 }}>{am}</Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Client List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Dynamic Database Clients */}
        {dbClients.map(client => (
          <motion.div key={client._id} variants={itemVariants}>
            <SlabCard 
              shadowColor={getStatusColor('Healthy')} 
              bodyStyle={{ padding: '24px' }} 
              style={{ borderLeft: `6px solid ${getStatusColor('Healthy')}`, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: getStatusColor('Healthy'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}>
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <Text style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 20, lineHeight: 1 }}>
                        {client.name}
                      </Text>
                      <div style={{ fontSize: 12, fontWeight: 800, color: getStatusColor('Healthy'), background: `${getStatusColor('Healthy')}15`, padding: '4px 10px', borderRadius: 20, border: `1px solid ${getStatusColor('Healthy')}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: getStatusColor('Healthy') }} />
                        Healthy <span style={{ opacity: 0.6 }}>· 100</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Recently Added
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Button type="primary" onClick={() => setSelectedClient({ ...client, code: client.name.substring(0,2).toUpperCase(), status: 'Healthy', mos: 100, industry: 'N/A', scores: { SEO: 0, ADS: 0, LEADS: 0, SOCIAL: 0, WEB: 0, GEO: 0 }, am: 'Unassigned', retainer: 'Custom', sla: 'N/A', activity: 'Just now' })} style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    View Client <ExternalLink size={16} style={{ marginLeft: 8 }} />
                  </Button>
                </div>
              </div>
            </SlabCard>
          </motion.div>
        ))}

        {/* Mock Clients */}
        {clients.map(client => (
          <motion.div key={client.id} variants={itemVariants}>
            <SlabCard 
              shadowColor={getStatusColor(client.status)} 
              bodyStyle={{ padding: '24px' }} 
              style={{ borderLeft: `6px solid ${getStatusColor(client.status)}`, overflow: 'hidden' }}
            >
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: getStatusColor(client.status), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}>
                    {client.code}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <Text style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 20, lineHeight: 1 }}>
                        {client.name}
                      </Text>
                      <div style={{ fontSize: 12, fontWeight: 800, color: getStatusColor(client.status), background: `${getStatusColor(client.status)}15`, padding: '4px 10px', borderRadius: 20, border: `1px solid ${getStatusColor(client.status)}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: getStatusColor(client.status) }} />
                        {client.status} <span style={{ opacity: 0.6 }}>· {client.mos}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {client.industry}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Button style={{ borderRadius: 8, fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'transparent', height: 40, display: 'flex', alignItems: 'center' }}>
                    <MoreHorizontal size={18} />
                  </Button>
                  <Button type="primary" onClick={() => setSelectedClient(client)} style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    View Client <ExternalLink size={16} style={{ marginLeft: 8 }} />
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0', opacity: 0.5 }} />

              {/* Bottom Content */}
              <Row gutter={[32, 24]}>
                {/* Scores */}
                <Col xs={24} lg={16}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>Performance Metrics</span>
                    <div style={{ display: 'flex', gap: '16px 24px', flexWrap: 'wrap' }}>
                      {Object.entries(client.scores).map(([label, score]) => (
                        <ScoreBar key={label} label={label} score={score} />
                      ))}
                    </div>
                  </div>
                </Col>

                {/* Details */}
                <Col xs={24} lg={8}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>Account Details</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', background: 'var(--bg-tertiary)', padding: 16, borderRadius: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Account Manager</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 13 }}>{client.am}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Retainer</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 13 }}>{client.retainer}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>SLA Status</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: 13 }}>{client.sla}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Last Activity</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 13 }}>{client.activity}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </SlabCard>
          </motion.div>
        ))}
      </div>

      {/* Client Detail Drawer */}
      <Drawer
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        width={480}
        closeIcon={<span style={{ color: 'var(--text-tertiary)', fontSize: 20 }}>×</span>}
        headerStyle={{ borderBottom: 'none', padding: '32px 32px 0 32px' }}
        bodyStyle={{ padding: 32 }}
        title={selectedClient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: getStatusColor(selectedClient.status), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
              {selectedClient.code}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedClient.name}</Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{selectedClient.industry}</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <Tag style={{ margin: 0, borderRadius: 12, background: `${getStatusColor(selectedClient.status)}20`, color: getStatusColor(selectedClient.status), border: 'none', fontWeight: 700, padding: '2px 10px' }}>
                  {selectedClient.mos} · {selectedClient.status}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>AM: {selectedClient.am}</Text>
              </div>
            </div>
          </div>
        )}
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Button type="primary" style={{ background: 'var(--accent-secondary)', height: 48, minHeight: 48, flexShrink: 0, borderRadius: 12, fontWeight: 700, fontSize: 15, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              Open Full Dashboard <ArrowUpRight size={18} style={{ marginLeft: 8 }} />
            </Button>
            
            <Tabs defaultActiveKey="1" tabBarStyle={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Tabs.TabPane tab="Summary" key="1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 16, marginBottom: 32 }}>
                  <Progress type="circle" percent={selectedClient.mos} strokeColor={getStatusColor(selectedClient.status)} trailColor="var(--bg-tertiary)" size={80} format={() => <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 20 }}>{selectedClient.mos}</span>} />
                  <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{selectedClient.mos}</Title>
                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>{selectedClient.status} · Grade A</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {Object.entries(selectedClient.scores).map(([label, score]) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1 }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{score}</span>
                      </div>
                      <Progress percent={score} showInfo={false} strokeColor={getScoreColor(score)} trailColor="var(--bg-tertiary)" size="small" />
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1, display: 'block', marginBottom: 12 }}>3 QUICKEST WINS</Text>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <li>· Fix mobile page speed (Web +6 pts)</li>
                    <li>· Schedule 8 GEO posts (GEO +9 pts)</li>
                    <li>· Restart paused Meta campaigns (Ads +4 pts)</li>
                  </ul>
                </div>

                <a style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: 14 }}>View Full MOS →</a>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Features & Access" key="2">
                {(() => {
                  const clientData = getClientData(selectedClient.code) || {};
                  const clientFeatures = clientData.features || [];
                  const clientPackage = clientData.package || 'Starter';

                  const handleFeatureToggle = (feature, checked) => {
                    const newFeatures = checked 
                      ? [...clientFeatures, feature] 
                      : clientFeatures.filter(f => f !== feature);
                    updateClientFeatures(selectedClient.code, newFeatures, clientPackage);
                    message.success(`Feature ${checked ? 'enabled' : 'disabled'} for ${selectedClient.name}`);
                  };

                  const handlePackageChange = (newPackageName) => {
                    const selectedPkg = packages.find(p => p.name === newPackageName);
                    if (selectedPkg) {
                      updateClientFeatures(selectedClient.code, selectedPkg.features, newPackageName);
                      message.success(`Package updated to ${newPackageName} for ${selectedClient.name}`);
                    }
                  };

                  return (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)' }}>Assigned Package</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Manage Tier</span>
                        </div>
                        <Select 
                          value={clientPackage} 
                          onChange={handlePackageChange}
                          style={{ width: 140, fontWeight: 700 }}
                          options={packages.map(pkg => ({ value: pkg.name, label: pkg.name }))}
                        />
                      </div>

                      <Title level={5} style={{ marginBottom: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Individual Features</Title>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { id: 'dashboard', label: 'Client Dashboard', icon: <AlertTriangle size={16} /> },
                          { id: 'performance', label: 'Performance Analytics', icon: <Zap size={16} /> },
                          { id: 'leads', label: 'Lead Management (CRM)', icon: <Users size={16} /> },
                          { id: 'website', label: 'Website Builder', icon: <Globe size={16} /> },
                          { id: 'store', label: 'Asset Store', icon: <Shield size={16} /> },
                        ].map(feat => (
                          <div key={feat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ color: 'var(--text-tertiary)' }}>{feat.icon}</div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{feat.label}</span>
                            </div>
                            <Switch 
                              checked={clientFeatures.includes(feat.id)} 
                              onChange={(checked) => handleFeatureToggle(feat.id, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Tasks" key="3" />
              <Tabs.TabPane tab="Billing" key="4" />
              <Tabs.TabPane tab="Activity" key="5" />
            </Tabs>
          </div>
        )}
      </Drawer>

      <Modal
        title="Create New Client"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClient}
        >
          <Form.Item
            name="name"
            label="Client Name"
            rules={[{ required: true, message: 'Please enter client name' }]}
          >
            <Input placeholder="e.g. Acme Corp" />
          </Form.Item>
          
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 700 }}>Client User</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Create an initial login account for this client.</Text>
            
            <Form.Item name="email" label="Client User Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input type="email" placeholder="manager@client.com" />
            </Form.Item>
            
            <Form.Item name="password" label="Initial Password" rules={[{ required: true, message: 'Please enter a password' }]}>
              <Input.Password placeholder="Enter a secure password" />
            </Form.Item>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 700 }}>Assign Package</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Select a package to assign initial features to this client.</Text>
            
            <Form.Item name="packageName" label="Package" rules={[{ required: true, message: 'Please select a package' }]}>
              <Select placeholder="Select a package">
                {packages.map(pkg => (
                  <Select.Option key={pkg.name} value={pkg.name}>{pkg.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ background: 'var(--accent-primary)', fontWeight: 700 }}>
              Create Client
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Packages Drawer */}
      <Drawer
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Manage Packages</span>}
        open={isPackagesDrawerOpen}
        onClose={() => { setIsPackagesDrawerOpen(false); setEditingPackage(null); }}
        width={480}
        closeIcon={<span style={{ color: 'var(--text-tertiary)', fontSize: 20 }}>×</span>}
        headerStyle={{ borderBottom: '1px solid var(--border-color)', padding: '24px 32px' }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Title level={5} style={{ margin: 0, fontWeight: 800 }}>Existing Packages</Title>
          {packages.map(pkg => (
            <div key={pkg.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', display: 'block' }}>{pkg.name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{pkg.features.length} features enabled</span>
              </div>
              <Button size="small" onClick={() => { setEditingPackage(pkg); packageForm.setFieldsValue(pkg); }}>Edit</Button>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Title level={5} style={{ margin: '0 0 24px 0', fontWeight: 800 }}>{editingPackage ? 'Edit Package' : 'Create New Package'}</Title>
          <Form form={packageForm} layout="vertical" onFinish={handleSavePackage}>
            <Form.Item name="name" label="Package Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Starter Tier" />
            </Form.Item>
            <Form.Item name="price" label="Price (Optional)">
              <Input placeholder="e.g. ₹1.5L/mo" />
            </Form.Item>
            <Form.Item name="features" label="Enabled Features">
              <Select mode="multiple" placeholder="Select features">
                {['dashboard', 'performance', 'leads', 'website', 'store', 'seo', 'strategy'].map(feat => (
                  <Select.Option key={feat} value={feat}>{feat}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {editingPackage && (
                <Button onClick={() => { setEditingPackage(null); packageForm.resetFields(); }} style={{ flex: 1 }}>Cancel</Button>
              )}
              <Button type="primary" htmlType="submit" style={{ flex: 1, background: 'var(--accent-primary)', fontWeight: 700 }}>
                {editingPackage ? 'Save Changes' : 'Create Package'}
              </Button>
            </div>
          </Form>
        </div>
      </Drawer>

    </motion.div>
  );
};

export default ClientsTab;
