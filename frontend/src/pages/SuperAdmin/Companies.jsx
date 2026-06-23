import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Input, Tag, Space, Dropdown, Menu, Modal, Form, Select, message } from 'antd';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Edit2, Trash2, Shield, Eye } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Companies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active',
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
    { key: 'login', icon: <Shield size={16} />, label: 'Login as Admin' },
    { type: 'divider' },
    { key: 'delete', danger: true, icon: <Trash2 size={16} />, label: 'Delete Company' }
  ];

  const handleMenuClick = (e, record) => {
    if (e.key === 'delete') {
      handleDelete(record._id);
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

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/agencies', values);
      message.success('Company created successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.response) {
        message.error('Failed to create company: ' + (error.response.data.message || error.message));
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
          onClick={() => setIsModalOpen(true)}
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
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Add New Company</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Subscription Plan</Text>} name="plan" rules={[{ required: true, message: 'Please select a plan' }]}>
              <Select style={{ borderRadius: 8 }} placeholder="Select a plan">
                {plans.map(p => (
                  <Option key={p._id} value={p.name.toLowerCase()}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Status</Text>} name="status" initialValue="active">
              <Select style={{ borderRadius: 8 }}>
                <Option value="trial">Trial</Option>
                <Option value="active">Active</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600 }}>Cancel</Button>
            <Button type="primary" onClick={handleCreate} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }}>Create Company</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Companies;
