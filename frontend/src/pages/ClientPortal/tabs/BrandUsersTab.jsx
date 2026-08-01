import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Tag, Modal, Form, Input, message } from 'antd';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, UserPlus } from 'lucide-react';

const { Title, Text } = Typography;

const BrandUsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (values) => {
    try {
      setSubmitLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: 'brand_manager'
        })
      });

      const data = await res.json();
      if (data.success) {
        message.success('User created successfully');
        setIsModalOpen(false);
        form.resetFields();
        fetchUsers();
      } else {
        message.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text) => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (text) => <Tag style={{ borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{text.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (text) => <Text type="secondary">{text}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => {
      const displayStatus = status === 'active' ? 'Active' : 'Pending Invite';
      return (
        <span style={{ color: displayStatus === 'Active' ? 'var(--accent-primary)' : 'var(--accent-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {displayStatus === 'Active' ? <CheckCircle2 size={14}/> : <div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-warning)'}}/>}
          {displayStatus}
        </span>
      );
    }},
    { title: 'Actions', key: 'actions', align: 'right', render: () => <Button type="link" style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>Manage</Button> }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Users Management</Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Manage your brand's team members.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<UserPlus size={16} />} 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, height: 40 }}
        >
          Create User
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Table 
          columns={columns} 
          dataSource={users} 
          loading={loading} 
          rowKey="_id" 
          pagination={false} 
          className="custom-table"
          style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}
        />
      </motion.div>

      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Create User</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser} style={{ marginTop: 24 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input placeholder="e.g. Jane Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input type="email" placeholder="jane@brand.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input placeholder="+1234567890" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter a password' }]}>
            <Input.Password placeholder="Enter a secure password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitLoading} block style={{ background: 'var(--accent-primary)', fontWeight: 700 }}>
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default BrandUsersTab;
