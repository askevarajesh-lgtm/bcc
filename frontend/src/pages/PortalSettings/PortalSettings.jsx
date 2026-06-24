import React, { useState, useEffect } from 'react';
import { Typography, Card, Select, Button, Switch, Input, Table, Tag, Avatar, ConfigProvider, Modal, Form, message, Drawer } from 'antd';
import { motion } from 'framer-motion';
import { ExternalLink, Upload, Pencil, Trash2, Plus, Palette, Layout, Database, Users, Bell } from 'lucide-react';
import { useFeatures } from '../../contexts/FeatureContext';

const { Title, Text } = Typography;
const { Option } = Select;

const PortalSettings = () => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'settings'
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPackagesDrawerOpen, setIsPackagesDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbBrands, setDbBrands] = useState([]);
  
  const [form] = Form.useForm();
  const [packageForm] = Form.useForm();
  
  const { packages, createPackage, updatePackage } = useFeatures();

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setDbBrands(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch brands', error);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreateBrand = async (values) => {
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
        message.success('Direct Brand created successfully');
        setIsCreateModalOpen(false);
        form.resetFields();
        fetchBrands();
      } else {
        message.error(data.message || 'Failed to create brand');
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

  const clientUsersCols = [
    { 
      title: 'USER', 
      key: 'user', 
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size="default" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border-color)' }}>{record.initials}</Avatar>
          <strong style={{ color: 'var(--text-primary)' }}>{record.name}</strong>
        </div>
      )
    },
    { title: 'ROLE', dataIndex: 'role', key: 'role', render: text => <Text type="secondary" style={{ fontWeight: 500 }}>{text}</Text> },
    { title: 'EMAIL', dataIndex: 'email', key: 'email', render: text => <Text type="secondary">{text}</Text> },
    { title: 'STATUS', dataIndex: 'status', key: 'status', render: text => <Tag style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', padding: '2px 10px', color: 'var(--text-primary)' }}><span style={{ color: 'var(--accent-secondary)' }}>●</span> {text}</Tag> },
    { 
      title: 'ACTIONS', 
      key: 'actions', 
      align: 'right',
      render: () => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="text" icon={<Pencil size={16} color="var(--text-secondary)" />} size="small" />
          <Button type="text" danger icon={<Trash2 size={16} />} size="small" />
        </div>
      ) 
    }
  ];

  const clientUsersData = [
    { key: '1', initials: 'RK', name: 'Rahul Kapoor', role: 'Admin', email: 'rahul@prestige.com', status: 'Active' },
    { key: '2', initials: 'SK', name: 'Sunita Kapoor', role: 'View Only', email: 'sunita@prestige.com', status: 'Active' },
  ];

  const SettingRow = ({ label, desc, action, borderBottom = true }) => (
    <motion.div 
      whileHover={{ backgroundColor: 'var(--bg-tertiary)', x: 4 }}
      transition={{ duration: 0.2 }}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px', 
        borderBottom: borderBottom ? '1px solid var(--border-color)' : 'none',
        borderRadius: 8,
        flexWrap: 'wrap',
        gap: 16
      }}
    >
      <div style={{ flex: '1 1 250px' }}>
        <strong style={{ display: 'block', fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</strong>
        {desc && <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{desc}</Text>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{action}</div>
    </motion.div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>PILLAR 01 · CLIENTS</Text>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Portal Settings</Title>
          <Text type="secondary">Per-client configuration for the white-label portal.</Text>
        </div>
      </motion.div>

      {viewMode === 'table' ? (
        <motion.div variants={itemVariants}>
          <Card className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }} bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Direct Brands</Title>
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
                  icon={<Plus size={16} />} 
                  style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  Create Direct Brand
                </Button>
              </div>
            </div>

            <Table 
              dataSource={dbBrands} 
              rowKey="_id" 
              pagination={false}
              columns={[
                {
                  title: 'BRAND NAME',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text) => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong>
                },
                {
                  title: 'SUPER ADMIN EMAIL',
                  dataIndex: 'adminEmail',
                  key: 'adminEmail',
                  render: (text) => text ? <Text type="secondary">{text}</Text> : <Text type="secondary" italic>Unassigned</Text>
                },
                {
                  title: 'PACKAGE',
                  dataIndex: 'packageName',
                  key: 'packageName',
                  render: (text) => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">-</Text>
                },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', padding: '2px 10px', color: 'var(--text-primary)' }}>
                      <span style={{ color: status === 'active' ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>●</span> {status}
                    </Tag>
                  )
                },
                {
                  title: 'ACTIONS',
                  key: 'actions',
                  align: 'right',
                  render: (_, record) => (
                    <Button 
                      type="primary" 
                      onClick={() => {
                        setSelectedClient(record._id);
                        setViewMode('settings');
                      }}
                      style={{ background: 'var(--accent-secondary)', fontWeight: 600, borderRadius: 6 }}
                    >
                      Portal Settings
                    </Button>
                  )
                }
              ]}
            />
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants}>
            <Button 
              type="text" 
              onClick={() => setViewMode('table')} 
              style={{ marginBottom: 16, fontWeight: 600, padding: 0, color: 'var(--text-secondary)' }}
            >
              ← Back to Brands
            </Button>
            <Card className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }} bodyStyle={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>CONFIGURING PORTAL FOR</Text>
                <Select value={selectedClient} onChange={setSelectedClient} style={{ width: 280, fontWeight: 600 }} size="large">
                  {dbBrands.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
                </Select>
              </div>
              <Button icon={<ExternalLink size={16} />} style={{ borderRadius: 8, height: 40, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', fontWeight: 600 }}>Open Live Portal</Button>
            </Card>
          </motion.div>

      {/* Wrapping Switches inside ConfigProvider to allow native CSS variable overrides for checked state */}
      <ConfigProvider theme={{ components: { Switch: { colorPrimary: 'var(--accent-secondary)', colorPrimaryHover: 'var(--accent-secondary)' } } }}>
        <motion.div variants={itemVariants}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--accent-secondary)', border: '1px solid var(--border-color)' }}><Palette size={20} /></div>
                <div>
                  <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Portal Appearance — Prestige Estates</Title>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>These settings OVERRIDE agency defaults for this specific client.</Text>
                </div>
              </div>
            } 
            className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 8 }}
          >
            <SettingRow 
              label="Client Logo" 
              desc="Shown in client's portal header alongside your agency logo" 
              action={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar style={{ backgroundColor: 'var(--accent-secondary)', fontWeight: 700, border: '1px solid var(--border-color)' }}>PE</Avatar>
                  <Button icon={<Upload size={14} />} style={{ borderRadius: 6, borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>Upload</Button>
                </div>
              } 
            />
            <SettingRow 
              label="Client Primary Colour" 
              desc="Used for this client's portal accents" 
              action={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}></div>
                  <Input value="var(--accent-secondary)" style={{ width: 180, borderRadius: 6 }} />
                </div>
              } 
            />
            <SettingRow 
              label="Portal Title" 
              desc="Shown in browser tab and portal header" 
              action={<Input value="Prestige Estates Marketing OS" style={{ width: 280, borderRadius: 6 }} />} 
            />
            <SettingRow 
              label="Custom Domain (client-specific)" 
              desc={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><span style={{ color: 'var(--accent-secondary)' }}>●</span> Active</span>}
              borderBottom={false}
              action={
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Switch defaultChecked />
                  <Input value="prestige.portal.bccmartech.com" style={{ width: 280, borderRadius: 6 }} />
                </div>
              } 
            />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}><Layout size={20} /></div>
                <div>
                  <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Which portal tabs does this client see?</Title>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Turn off tabs that aren't relevant for this client.</Text>
                </div>
              </div>
            } 
            className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 8 }}
          >
            <SettingRow label="Dashboard" desc="always on — cannot toggle off" action={<Switch defaultChecked disabled />} />
            <SettingRow label="My Performance" action={<Switch defaultChecked />} />
            <SettingRow label="Leads" action={<Switch defaultChecked />} />
            <SettingRow label="Tasks" action={<Switch defaultChecked />} />
            <SettingRow label="Billing" action={<Switch defaultChecked />} />
            <SettingRow label="Support" action={<Switch defaultChecked />} />
            <SettingRow label="Store (Marketplace)" action={<Switch defaultChecked />} borderBottom={false} />
            <div style={{ padding: '16px 20px', background: 'var(--bg-tertiary)', borderRadius: 8, margin: 8, border: '1px solid var(--border-color)' }}>
              <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', display: 'block' }}>For a client without lead tracking, turn off the Leads tab.</Text>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--accent-warning)', border: '1px solid var(--border-color)' }}><Database size={20} /></div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>What data can this client see?</Title>
              </div>
            } 
            className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 8 }}
          >
            <SettingRow label="Show MOS Score" action={<Switch defaultChecked />} />
            <SettingRow label="Show competitor benchmarks" action={<Switch defaultChecked />} />
            <SettingRow label="Show lead source breakdown" action={<Switch defaultChecked />} />
            <SettingRow label="Show ad spend amounts" action={<Switch defaultChecked />} />
            <SettingRow label="Show individual keyword rankings" action={<Switch defaultChecked />} />
            <SettingRow label="Show GEO / AI citations" action={<Switch defaultChecked />} />
            <SettingRow label="Show team member names" desc="client sees initials only" action={<Switch />} />
            <SettingRow label="Show agency cost data" desc="always off — cannot toggle on" action={<Switch disabled />} />
            <SettingRow label="Show other client data" desc="always off — cannot toggle on" action={<Switch disabled />} borderBottom={false} />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--accent-secondary)', border: '1px solid var(--border-color)' }}><Users size={20} /></div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Who has access to this client's portal?</Title>
              </div>
            } 
            className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table columns={clientUsersCols} dataSource={clientUsersData} pagination={false} size="middle" scroll={{ x: 600 }} style={{ minWidth: 600 }} />
            </div>
            <div style={{ padding: 20, borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <Button type="primary" icon={<Plus size={16} />} style={{ background: 'var(--accent-secondary)', borderRadius: 8, border: 'none', height: 40, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>Invite Client User</Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--accent-danger)', border: '1px solid var(--border-color)' }}><Bell size={20} /></div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>What alerts does this client receive?</Title>
              </div>
            } 
            className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 8 }}
          >
            <SettingRow label="Monthly performance report" desc="1st of month · Email" action={<Switch defaultChecked />} />
            <SettingRow label="SLA breach notification" desc="Immediate · Email + WhatsApp" action={<Switch defaultChecked />} />
            <SettingRow label="Content approval reminder" desc="After 3 days pending · Email" action={<Switch defaultChecked />} />
            <SettingRow label="New lead notification" action={<Switch />} />
            <SettingRow label="Invoice due reminder" desc="7 days before due · Email" action={<Switch defaultChecked />} />
            <SettingRow label="MOS milestone (score improves)" desc="Email" action={<Switch defaultChecked />} />
            <SettingRow label="Approval needed alert" desc="Immediate · WhatsApp" action={<Switch defaultChecked />} borderBottom={false} />
          </Card>
        </motion.div>
      </ConfigProvider>
      </>
      )}

      {/* Create Direct Brand Modal */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Create Direct Brand</span>}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBrand} style={{ marginTop: 24 }}>
          <Form.Item name="name" label={<span style={{ fontWeight: 700 }}>Brand Name</span>} rules={[{ required: true, message: 'Please enter brand name' }]}>
            <Input size="large" placeholder="e.g. Acme Corp" style={{ borderRadius: 8 }} />
          </Form.Item>
          
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 700 }}>Brand Super Admin User</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Create an initial super admin login account for this brand.</Text>
            
            <Form.Item name="email" label="Admin Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input type="email" placeholder="admin@brand.com" />
            </Form.Item>
            
            <Form.Item name="password" label="Initial Password" rules={[{ required: true, message: 'Please enter a password' }]}>
              <Input.Password placeholder="Enter a secure password" />
            </Form.Item>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 700 }}>Assign Package</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Select a package to assign initial features to this brand.</Text>
            
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
              Create Brand
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

export default PortalSettings;
