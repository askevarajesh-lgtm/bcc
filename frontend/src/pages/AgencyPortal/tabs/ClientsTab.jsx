import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Tag, Row, Col, Drawer, Tabs, Progress, Switch, Select, message, Modal, Form } from 'antd';
import { Search, AlertTriangle, CheckCircle, ExternalLink, MoreHorizontal, Circle, ArrowUpRight, Shield, Zap, Globe, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import SlabCard from '../../../components/SlabCard';
import { useFeatures } from '../../../contexts/FeatureContext';
import TaskListView from '../../Tasks/TaskListView';
import TaskDetailDrawer from '../../Tasks/TaskDetailDrawer';
import ClientBilling from './ClientBilling';
import ClientActivity from './ClientActivity';

const { Title, Text } = Typography;

const ClientsTab = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbClients, setDbClients] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDrawerVisible, setTaskDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { getClientData, updateClientFeatures, packages, createPackage, updatePackage } = useFeatures();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const [brandsRes, mosRes] = await Promise.all([
        fetch('/api/brands', { headers }),
        fetch('/api/mos/dashboard', { headers })
      ]);
      
      const brandsData = await brandsRes.json();
      const mosData = await mosRes.json();
      
      const mosClients = mosData.success && mosData.data ? mosData.data.clients : [];
      
      if (brandsData.success) {
        setDbClients(brandsData.data.map(c => {
          const mosInfo = mosClients.find(m => m.clientId === c._id) || {};
          
          return {
            ...c,
            code: c.code || c.name?.substring(0, 2).toUpperCase() || 'NA',
            status: mosInfo.overall >= 70 ? 'Healthy' : mosInfo.overall >= 50 ? 'At Risk' : 'Critical',
            mos: mosInfo.overall || 0,
            industry: c.industry || 'Unknown',
            am: c.am || 'Unassigned',
            scores: mosInfo.overall ? {
              SEO: mosInfo.seo,
              ADS: mosInfo.ads,
              LEADS: mosInfo.leads,
              SOCIAL: mosInfo.social,
              WEB: mosInfo.website,
              GEO: mosInfo.geo || 0
            } : { SEO: 0, ADS: 0, LEADS: 0, SOCIAL: 0, WEB: 0, GEO: 0 }
          };
        }));
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>All Clients</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
            {dbClients.length} total active clients in your agency
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
            placeholder="Search clients by name or email..." 
            style={{ 
              maxWidth: 400, 
              background: 'transparent', 
              border: 'none', 
              boxShadow: 'none',
              fontSize: 15
            }}
          />
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
                      Created By: {client.createdBy ? client.createdBy.name : 'System'} ({client.createdBy?.role === 'agency_super_admin' ? 'Agency Admin' : client.createdBy?.role === 'agency_manager' ? 'Agency Manager' : 'Admin'})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Button type="primary" onClick={() => setSelectedClient(client)} style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    View Client <ExternalLink size={16} style={{ marginLeft: 8 }} />
                  </Button>
                </div>
              </div>
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

                  const allFeatures = [
                    { id: 'dashboard', label: 'Client Dashboard', icon: <AlertTriangle size={16} /> },
                    { id: 'performance', label: 'Performance Analytics', icon: <Zap size={16} /> },
                    { id: 'leads', label: 'Lead Management (CRM)', icon: <Users size={16} /> },
                    { id: 'website', label: 'Website Builder', icon: <Globe size={16} /> },
                    { id: 'store', label: 'Asset Store', icon: <Shield size={16} /> },
                  ];
                  
                  const enabledFeatures = allFeatures.filter(feat => clientFeatures.includes(feat.id));

                  return (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)' }}>Assigned Package</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{clientPackage}</span>
                        </div>
                      </div>

                      <Title level={5} style={{ marginBottom: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Enabled Modules</Title>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {enabledFeatures.length > 0 ? enabledFeatures.map(feat => (
                          <div key={feat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                            <div style={{ color: 'var(--accent-primary)' }}>{feat.icon}</div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{feat.label}</span>
                            <div style={{ marginLeft: 'auto' }}>
                              <Tag color="success" style={{ margin: 0, borderRadius: 10, fontWeight: 700 }}>Enabled</Tag>
                            </div>
                          </div>
                        )) : (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            No modules are currently enabled for this client.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Tasks" key="3">
                <div style={{ marginTop: 16 }}>
                  <TaskListView 
                    clientId={selectedClient?.id || selectedClient?._id} 
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setTaskDrawerVisible(true);
                    }} 
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Billing" key="4">
                <ClientBilling clientId={selectedClient?.id || selectedClient?._id} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Activity" key="5">
                <ClientActivity clientId={selectedClient?.id || selectedClient?._id} />
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Users size={20} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Create New Client</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>Provision a new workspace and admin account</Text>
            </div>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={520}
        closeIcon={<span style={{ color: 'var(--text-tertiary)', fontSize: 20 }}>×</span>}
        styles={{ 
          header: { padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--border-color)' }, 
          body: { padding: '24px' },
          content: { borderRadius: 16, overflow: 'hidden' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClient}
          requiredMark={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'block' }}>
                Company Details
              </Text>
              <Form.Item
                name="name"
                label={<span style={{ fontWeight: 600 }}>Client Company Name</span>}
                rules={[{ required: true, message: 'Please enter client name' }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="e.g. Acme Corp" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </div>
            
            <div>
              <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'block' }}>
                Admin Account
              </Text>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item 
                    name="email" 
                    label={<span style={{ fontWeight: 600 }}>Admin Email</span>} 
                    rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                  >
                    <Input type="email" placeholder="manager@client.com" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item 
                    name="password" 
                    label={<span style={{ fontWeight: 600 }}>Initial Password</span>} 
                    rules={[{ required: true, message: 'Please enter a password' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.Password placeholder="Enter a secure password" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div>
              <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'block' }}>
                Subscription
              </Text>
              <Form.Item 
                name="packageName" 
                label={<span style={{ fontWeight: 600 }}>Assign Package</span>} 
                rules={[{ required: true, message: 'Please select a package' }]}
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="Select a package" size="large" style={{ borderRadius: 8 }}>
                  {packages.map(pkg => (
                    <Select.Option key={pkg.name} value={pkg.name}>{pkg.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button 
              onClick={() => setIsCreateModalOpen(false)}
              style={{ fontWeight: 600, borderRadius: 8, height: 44, padding: '0 24px' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, height: 44, padding: '0 24px' }}
            >
              Provision Workspace
            </Button>
          </div>
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

      <TaskDetailDrawer
        visible={taskDrawerVisible}
        onClose={() => {
          setTaskDrawerVisible(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={() => {
          // Optionally trigger a refetch here if needed
        }}
      />
    </motion.div>
  );
};

export default ClientsTab;
