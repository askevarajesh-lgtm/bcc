import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Tag, Row, Col, Drawer, Tabs, Progress, Switch, Select, message, Modal, Form, Checkbox, Table, Dropdown, Menu, Popconfirm } from 'antd';
import { Search, AlertTriangle, CheckCircle, ExternalLink, MoreHorizontal, Circle, ArrowUpRight, Shield, Zap, Globe, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import SlabCard from '../../../components/SlabCard';
import TaskListView from '../../Tasks/TaskListView';
import TaskDetailDrawer from '../../Tasks/TaskDetailDrawer';
import ClientBilling from './ClientBilling';
import ClientActivity from './ClientActivity';

const { Title, Text } = Typography;

const availableFeatures = [
  { id: 'crm', label: 'CRM & Leads' },
  { id: 'website', label: 'Website Builder' },
  { id: 'social', label: 'Social Media' },
  { id: 'ads', label: 'Performance Ads' },
  { id: 'analytics', label: 'Analytics & Attribution' },
  { id: 'chatgpt', label: 'Chatgpt' },
  { id: 'canva', label: 'Canva' },
  { id: 'benchmark', label: 'Benchmark' },
];

const ClientsTab = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbClients, setDbClients] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDrawerVisible, setTaskDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [packages, setPackages] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchPackages = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const res = await fetch('/api/agency/client-packages', { headers });
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch packages', error);
    }
  };

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
            accountStatus: c.status || 'active',
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
    fetchPackages();
  }, []);

  const handleCreateClient = async (values) => {
    try {
      setLoading(true);

      let selectedPackage = null;
      if (values.packageName) {
        selectedPackage = packages.find(p => p.name === values.packageName);
      }

      const payload = {
        ...values,
        features: selectedPackage ? selectedPackage.features : [],
        mrr: selectedPackage ? selectedPackage.price : 0
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



  const handleEditClientSubmit = async (values) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${editingClient._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          features: values.features || []
        })
      });
      const data = await res.json();
      
      if (data.success) {
        message.success('Client updated successfully');
        setIsEditModalOpen(false);
        setEditingClient(null);
        fetchClients();
      } else {
        message.error(data.message || 'Failed to update client');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClient = async (clientId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const res = await fetch(`/api/brands/${clientId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        message.success(`Client ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
        fetchClients();
      } else {
        message.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/brands/${clientId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        message.success('Client deleted successfully');
        fetchClients();
      } else {
        message.error(data.message || 'Failed to delete client');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };


  const selectedPackageName = Form.useWatch('packageName', form);
  const selectedPackageObj = packages.find(p => p.name === selectedPackageName) || null;
  const includedFeatures = selectedPackageObj ? selectedPackageObj.features : [];

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
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={() => setIsCreateModalOpen(true)}
            style={{ borderRadius: 8, background: 'var(--accent-primary)', fontWeight: 600, border: 'none' }}
          >
            Create Client
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

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>Edit Client Modules</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)' }}>{editingClient?.name}</div>
            </div>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={loading}
        okText="Save Changes"
        cancelText="Cancel"
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditClientSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="features" label="Enabled Modules" help="Select which modules this client has access to.">
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {availableFeatures.map(feat => (
                  <Col span={12} key={feat.id}>
                    <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <Checkbox value={feat.id}>
                        <span style={{ fontWeight: 600 }}>{feat.label}</span>
                      </Checkbox>
                    </div>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <Table
          className="custom-table"
          dataSource={dbClients}
          rowKey="_id"
          pagination={false}
          columns={[
            {
              title: 'Client Name',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 800, fontSize: 16 }}>
                    {record.code}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{text}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{record.adminEmail || record.email}</div>
                  </div>
                </div>
              )
            },
            {
              title: 'Package',
              dataIndex: 'packageName',
              key: 'packageName',
              render: (text) => text || 'Custom'
            },
            {
              title: 'Account Status',
              dataIndex: 'accountStatus',
              key: 'accountStatus',
              render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                  {status === 'active' ? 'Active' : 'Suspended'}
                </Tag>
              )
            },
            {
              title: 'Health',
              dataIndex: 'status',
              key: 'health',
              render: (status, record) => (
                <Tag style={{ borderRadius: 12, background: `${getStatusColor(status)}15`, color: getStatusColor(status), border: `1px solid ${getStatusColor(status)}40`, fontWeight: 600 }}>
                  {record.mos} · {status}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'view',
                        label: 'View Client',
                        onClick: () => setSelectedClient(record)
                      },
                      {
                        key: 'edit',
                        label: 'Edit Modules',
                        onClick: () => {
                          setEditingClient(record);
                          editForm.setFieldsValue({ features: record.features || [] });
                          setIsEditModalOpen(true);
                        }
                      },
                      {
                        key: 'suspend',
                        label: record.accountStatus === 'suspended' ? 'Activate Client' : 'Suspend Client',
                        onClick: () => handleSuspendClient(record._id, record.accountStatus)
                      },
                      {
                        type: 'divider'
                      },
                      {
                        key: 'delete',
                        danger: true,
                        label: (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                              title="Delete Client"
                              description="Are you sure you want to delete this client? This action cannot be undone."
                              onConfirm={() => handleDeleteClient(record._id)}
                              okText="Yes"
                              cancelText="No"
                              okButtonProps={{ danger: true }}
                            >
                              <div style={{ width: '100%' }}>Delete Client</div>
                            </Popconfirm>
                          </div>
                        )
                      }
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button type="text" icon={<MoreHorizontal size={18} />} />
                </Dropdown>
              )
            }
          ]}
        />
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
                  const clientFeatures = selectedClient.features || [];
                  const clientPackage = selectedClient.packageName || 'Custom';
                  
                  const enabledFeatures = availableFeatures.filter(feat => clientFeatures.includes(feat.id));

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
                            <div style={{ color: 'var(--accent-primary)' }}><CheckCircle size={16} /></div>
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
          body: { padding: '24px', maxHeight: '550px', overflowY: 'auto' },
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

            <div style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'block' }}>
                Subscription
              </Text>
              <Form.Item 
                name="packageName" 
                label={<span style={{ fontWeight: 600 }}>Assign Package</span>} 
                rules={[{ required: true, message: 'Please select a package' }]}
                style={{ marginBottom: 16 }}
              >
                <Select placeholder="Select a package" size="large" style={{ borderRadius: 8 }}>
                  {packages.map(pkg => (
                    <Select.Option key={pkg.name} value={pkg.name}>{pkg.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              {selectedPackageName && (
                <div>
                  <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' }}>
                    Included Modules
                  </Text>
                  <Row gutter={[16, 16]}>
                    {availableFeatures.map(feat => {
                      const isIncluded = includedFeatures.includes(feat.id);
                      return (
                        <Col span={12} key={feat.id}>
                          <Checkbox checked={isIncluded} disabled>
                            {feat.label}
                          </Checkbox>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
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
