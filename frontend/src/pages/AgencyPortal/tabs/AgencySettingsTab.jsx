import React, { useState } from 'react';
import { Typography, Tabs, Form, Input, Button, Card, Row, Col, Divider, Tag, Avatar, message } from 'antd';
import { motion } from 'framer-motion';
import { Building2, User, CreditCard, Save, Shield, Star } from 'lucide-react';

const { Title, Text } = Typography;

const AgencySettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [formAgency] = Form.useForm();
  const [formAccount] = Form.useForm();

  const handleSaveAgency = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Agency details updated successfully');
    }, 1000);
  };

  const handleSaveAccount = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Account details updated successfully');
    }, 1000);
  };

  const AgencyProfileContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>Agency Profile</Title>
        <Form form={formAgency} layout="vertical" onFinish={handleSaveAgency} initialValues={{ name: 'Alpha Partners', domain: 'alpha.agency.com', email: 'contact@alpha.agency.com' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Agency Name</Text>} name="name">
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Custom Domain</Text>} name="domain">
                <Input size="large" style={{ borderRadius: 8 }} addonBefore="https://" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Contact Email</Text>} name="email">
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Support Phone</Text>} name="phone">
                <Input size="large" style={{ borderRadius: 8 }} placeholder="+1 (555) 000-0000" />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<Save size={16} />} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }} size="large">
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </motion.div>
  );

  const MyAccountContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>My Account Details</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <Avatar size={80} style={{ backgroundColor: 'var(--accent-secondary)', fontSize: 32, fontWeight: 800 }}>AA</Avatar>
          <div>
            <Button style={{ borderRadius: 8, marginRight: 12 }}>Upload New Photo</Button>
            <Button type="text" danger>Remove</Button>
          </div>
        </div>
        <Form form={formAccount} layout="vertical" onFinish={handleSaveAccount} initialValues={{ firstName: 'Agency', lastName: 'Admin', email: 'agencyadmin@gmail.com' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>First Name</Text>} name="firstName">
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Last Name</Text>} name="lastName">
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Email Address</Text>} name="email">
                <Input size="large" style={{ borderRadius: 8 }} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Title level={5} style={{ marginBottom: 16, fontWeight: 700 }}>Change Password</Title>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Current Password</Text>} name="currentPassword">
                <Input.Password size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>New Password</Text>} name="newPassword">
                <Input.Password size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<Save size={16} />} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }} size="large">
              Update Account
            </Button>
          </div>
        </Form>
      </Card>
    </motion.div>
  );

  const SubscriptionContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Current Plan</Title>
            <Text type="secondary">You are currently on the <strong style={{ color: 'var(--text-primary)' }}>Pro Agency</strong> plan.</Text>
          </div>
          <Tag color="success" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 14, fontWeight: 600, border: '1px solid var(--accent-secondary)', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-secondary)' }}>
            <Star size={14} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} /> Active
          </Tag>
        </div>
        
        <Divider />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Billing Cycle</Text>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>Monthly</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Next Payment</Text>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>$299.00 USD</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Renewal Date</Text>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>July 15, 2026</Text>
          </Col>
        </Row>

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <Button type="primary" style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }} size="large">Upgrade Plan</Button>
          <Button style={{ borderRadius: 8, fontWeight: 600 }} size="large">Cancel Subscription</Button>
        </div>
      </Card>
      
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Title level={4} style={{ marginBottom: 16, fontWeight: 700 }}>Payment Methods</Title>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: 6, fontWeight: 800, color: '#333' }}>VISA</div>
            <div>
              <Text style={{ display: 'block', fontWeight: 600 }}>Visa ending in 4242</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Expires 12/28</Text>
            </div>
          </div>
          <Button type="text" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Edit</Button>
        </div>
        <Button type="dashed" block style={{ marginTop: 16, height: 48, borderRadius: 12, fontWeight: 600 }} icon={<CreditCard size={16} />}>
          Add Payment Method
        </Button>
      </Card>
    </motion.div>
  );

  const items = [
    {
      key: 'agency',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={16} /> Agency Profile</span>,
      children: <AgencyProfileContent />,
    },
    {
      key: 'account',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> My Account</span>,
      children: <MyAccountContent />,
    },
    {
      key: 'subscription',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> Subscription</span>,
      children: <SubscriptionContent />,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Settings</Title>
        <Text type="secondary">Manage your agency preferences and configurations.</Text>
      </div>
      
      <Tabs 
        defaultActiveKey="agency" 
        items={items} 
        animated={{ inkBar: true, tabPane: true }}
        size="large"
        tabBarStyle={{ marginBottom: 24, fontWeight: 600 }}
      />
    </motion.div>
  );
};

export default AgencySettingsTab;
