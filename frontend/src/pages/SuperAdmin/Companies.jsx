import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Input, Tag, Space, Dropdown, Menu, Modal, Form, Select, message, Avatar, Divider } from 'antd';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Edit2, Trash2, Shield, Eye, Mail, Users, Calendar, DollarSign, Building2, Activity, Star, X } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Companies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);
  const [form] = Form.useForm();
  const [companiesData, setCompaniesData] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agenciesRes, plansRes] = await Promise.all([
        api.get('/agencies'),
        api.get('/subscriptions')
      ]);
      
      setPlans(plansRes.data.data || []);
      
      setCompaniesData(agenciesRes.data.data.map(item => ({
        key: item._id,
        _id: item._id,
        name: item.name || 'Unknown',
        email: item.email || 'N/A',
        users: item.allowedUsers || 0,
        plan: item.plan ? (typeof item.plan === 'object' ? item.plan.name : item.plan.charAt(0).toUpperCase() + item.plan.slice(1)) : 'Pro',
        planId: item.plan ? (typeof item.plan === 'object' ? item.plan._id : item.plan) : null,
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active',
        rawStatus: item.status ? item.status.toLowerCase() : 'active',
        mrr: `$${item.mrr || 0}`,
        joined: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
      })));
    } catch (error) {
      message.error('Failed to fetch agencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/agencies/${id}`);
      message.success('Company deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete company');
    }
  };

  const getActionMenu = (record) => [
    { key: 'view', icon: <Eye size={16} />, label: 'View Details' },
    { key: 'edit', icon: <Edit2 size={16} />, label: 'Edit Company' },
    { type: 'divider' },
    { key: 'delete', danger: true, icon: <Trash2 size={16} />, label: 'Delete Company' }
  ];

  const handleMenuClick = (e, record) => {
    if (e.key === 'delete') {
      handleDelete(record._id);
    } else if (e.key === 'edit') {
      setEditingCompany(record);
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        plan: record.planId,
        status: record.rawStatus,
      });
      setIsModalOpen(true);
    } else if (e.key === 'view') {
      setViewCompany(record);
      setIsViewModalOpen(true);
    }
  };

  const columns = [
    {
      title: 'Company / Agency',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Active Users',
      dataIndex: 'users',
      key: 'users',
      render: (text) => <Text style={{ fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: 'Subscription Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => (
        <Tag color={plan === 'Enterprise' ? 'purple' : plan === 'Pro' ? 'blue' : 'default'} style={{ borderRadius: 12, px: 8 }}>
          {plan}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'Trial') color = 'orange';
        if (status === 'Churned') color = 'red';
        return <Tag color={color} style={{ borderRadius: 12 }}>{status}</Tag>;
      },
    },
    {
      title: 'MRR',
      dataIndex: 'mrr',
      key: 'mrr',
      render: (text) => <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{text}</Text>,
    },
    {
      title: 'Joined Date',
      dataIndex: 'joined',
      key: 'joined',
      render: (text) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenu(record), onClick: (e) => handleMenuClick(e, record) }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreVertical size={16} style={{ color: 'var(--text-secondary)' }} />} />
        </Dropdown>
      ),
    },
  ];

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCompany) {
        await api.put(`/agencies/${editingCompany._id}`, values);
        message.success('Company updated successfully');
      } else {
        await api.post('/agencies', values);
        message.success('Company created successfully');
      }
      setIsModalOpen(false);
      setEditingCompany(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.response) {
        message.error(`Failed to ${editingCompany ? 'update' : 'create'} company: ` + (error.response.data.message || error.message));
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
            Companies
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage agencies and companies using the platform.
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          style={{ background: 'var(--accent-primary)', height: 44, borderRadius: 8, fontWeight: 600 }}
          onClick={() => {
            setEditingCompany(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Add Company
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card 
          className="glassmorphism"
          style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
          bodyStyle={{ padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <Input 
              placeholder="Search companies by name or email..." 
              prefix={<Search size={18} style={{ color: 'var(--text-tertiary)' }} />}
              style={{ width: 320, borderRadius: 8, height: 40 }}
            />
            <Space>
              <Select defaultValue="all" style={{ width: 140, height: 40 }} className="custom-select">
                <Option value="all">All Plans</Option>
                {plans.map(p => (
                  <Option key={p._id} value={p.name.toLowerCase()}>{p.name}</Option>
                ))}
              </Select>
              <Select defaultValue="active" style={{ width: 140, height: 40 }} className="custom-select">
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="trial">Trial</Option>
                <Option value="churned">Churned</Option>
              </Select>
            </Space>
          </div>

          <Table 
            columns={columns} 
            dataSource={companiesData} 
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="custom-table"
          />
        </Card>
      </motion.div>

      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>{editingCompany ? 'Edit Company' : 'Add New Company'}</span>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCompany(null);
          form.resetFields();
        }}
        footer={null}
        className="glass-modal"
        centered
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Company Name</Text>} name="name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Acme Corp" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Admin Email</Text>} name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="admin@company.com" style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Admin Password</Text>} name="password" rules={[{ required: !editingCompany }]}>
              <Input.Password placeholder={editingCompany ? "Leave blank to keep unchanged" : "Enter admin password"} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Subscription Plan</Text>} name="plan" rules={[{ required: true, message: 'Please select a plan' }]}>
              <Select style={{ borderRadius: 8 }} placeholder="Select a plan">
                {plans.map(p => (
                  <Option key={p._id} value={p._id}>{p.name}</Option> // Use p._id instead of name for referencing plan properly in backend
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Status</Text>} name="status" initialValue="active">
              <Select style={{ borderRadius: 8 }}>
                <Option value="trial">Trial</Option>
                <Option value="active">Active</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => {
              setIsModalOpen(false);
              setEditingCompany(null);
              form.resetFields();
            }} style={{ borderRadius: 8, fontWeight: 600 }}>Cancel</Button>
            <Button type="primary" onClick={handleSave} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }}>
              {editingCompany ? 'Save Changes' : 'Create Company'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        className="glass-modal view-company-modal"
        centered
        width={550}
        closeIcon={null}
        styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: 16 } }}
      >
        {viewCompany && (
          <div>
            {/* Header Section */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)', 
              padding: '32px 24px 24px', 
              position: 'relative',
              color: 'white' 
            }}>
              <Button 
                type="text" 
                icon={<X size={20} />} 
                onClick={() => setIsViewModalOpen(false)} 
                style={{ position: 'absolute', top: 16, right: 16, color: 'rgba(255,255,255,0.8)' }} 
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar 
                  size={64} 
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: '#fff', 
                    fontSize: 24, 
                    fontWeight: 800,
                    border: '2px solid rgba(255,255,255,0.5)' 
                  }}
                >
                  {viewCompany.name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Title level={3} style={{ color: '#fff', margin: '0 0 4px 0', fontWeight: 800 }}>{viewCompany.name}</Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)' }}>
                    <Mail size={14} />
                    <Text style={{ color: 'inherit' }}>{viewCompany.email}</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: '24px 24px 32px', background: 'var(--bg-secondary)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <Card 
                  styles={{ body: { padding: 16, display: 'flex', alignItems: 'center', gap: 12 } }}
                  style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 10, color: 'var(--accent-primary)', display: 'flex' }}>
                    <Star size={20} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Plan</Text>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{viewCompany.plan}</div>
                  </div>
                </Card>

                <Card 
                  styles={{ body: { padding: 16, display: 'flex', alignItems: 'center', gap: 12 } }}
                  style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ background: viewCompany.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : viewCompany.status === 'Trial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 10, color: viewCompany.status === 'Active' ? '#10b981' : viewCompany.status === 'Trial' ? '#f59e0b' : '#ef4444', display: 'flex' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Status</Text>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{viewCompany.status}</div>
                  </div>
                </Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <Users size={18} style={{ color: 'var(--text-secondary)', marginBottom: 8, display: 'inline-block' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{viewCompany.users}</div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Active Users</Text>
                </div>
                
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <DollarSign size={18} style={{ color: 'var(--text-secondary)', marginBottom: 8, display: 'inline-block' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{viewCompany.mrr}</div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Monthly Rev</Text>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <Calendar size={18} style={{ color: 'var(--text-secondary)', marginBottom: 8, display: 'inline-block' }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{viewCompany.joined}</div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Joined On</Text>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                <Button onClick={() => setIsViewModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600, padding: '0 32px', height: 40 }}>Close Details</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Companies;
