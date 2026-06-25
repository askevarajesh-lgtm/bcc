import React, { useState } from 'react';
import { Typography, Tabs, Card, Form, Input, Button, Upload, Select, message, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Building, Package, Shield, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const BrandSettingsTab = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSaveDetails = (values) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      message.success('Brand details updated successfully');
      setLoading(false);
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const brandDetailsContent = (
    <div style={{ maxWidth: 800 }}>
      <Card 
        className="glassmorphism" 
        style={{ borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}
        bodyStyle={{ padding: 32 }}
      >
        <Title level={4} style={{ marginTop: 0, marginBottom: 24, fontWeight: 800 }}>Brand Profile</Title>
        <Form form={form} layout="vertical" onFinish={handleSaveDetails} initialValues={{ name: user?.companyName || 'My Brand', email: user?.email }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 100, height: 100, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <UploadIcon size={24} color="var(--text-secondary)" style={{ marginBottom: 8 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Logo</span>
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Upload your brand's primary logo. Recommended size: 400x400px.</Text>
              <Upload showUploadList={false}>
                <Button style={{ borderRadius: 8 }}>Choose File</Button>
              </Upload>
            </div>
          </div>

          <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Brand Name</span>} rules={[{ required: true }]}>
            <Input size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          
          <Form.Item name="email" label={<span style={{ fontWeight: 600 }}>Primary Contact Email</span>} rules={[{ required: true, type: 'email' }]}>
            <Input size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="website" label={<span style={{ fontWeight: 600 }}>Website URL</span>}>
            <Input size="large" placeholder="https://" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="industry" label={<span style={{ fontWeight: 600 }}>Industry</span>}>
            <Select size="large" placeholder="Select industry">
              <Select.Option value="ecommerce">E-Commerce</Select.Option>
              <Select.Option value="saas">SaaS</Select.Option>
              <Select.Option value="realestate">Real Estate</Select.Option>
              <Select.Option value="healthcare">Healthcare</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8, height: 40, padding: '0 32px' }}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const brandPlansContent = (
    <div style={{ maxWidth: 800 }}>
      <Card 
        className="glassmorphism" 
        style={{ borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <Title level={4} style={{ marginTop: 0, marginBottom: 8, fontWeight: 800 }}>Current Subscription</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Manage your active features and usage limits.</Text>
          </div>
          <Tag color="green" style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 700, fontSize: 13, border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Active</Tag>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--accent-primary)', padding: 8, borderRadius: 8, color: '#fff' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Growth Package</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Billed monthly via Agency</div>
            </div>
          </div>
          
          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 500 }}><Shield size={16} color="var(--accent-secondary)" /> Full access to Workspace Apps</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 500 }}><Shield size={16} color="var(--accent-secondary)" /> Unlimited Team Seats</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 500 }}><Shield size={16} color="var(--accent-secondary)" /> Advanced Analytics & Reports</li>
          </ul>
        </div>

        <Button type="primary" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 700, borderRadius: 8, height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
          Request Plan Upgrade <ExternalLink size={16} />
        </Button>
      </Card>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>ADMINISTRATION</Text>
        <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>Brand Settings</Title>
        <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Manage your brand's profile and active subscriptions.</Text>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs 
          defaultActiveKey="details" 
          tabBarStyle={{ fontWeight: 600, color: 'var(--text-secondary)' }}
          items={[
            { key: 'details', label: <span><Building size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />Brand Details</span>, children: brandDetailsContent },
            { key: 'plans', label: <span><Package size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />Brand Plans</span>, children: brandPlansContent },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default BrandSettingsTab;
