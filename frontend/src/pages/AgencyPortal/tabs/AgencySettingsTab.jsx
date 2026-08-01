import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Form, Input, Button, Card, Row, Col, Divider, Tag, Avatar, message, Modal, Select, Checkbox, ColorPicker } from 'antd';
import { motion } from 'framer-motion';
import { Building2, User, CreditCard, Save, Shield, Star, Users, Briefcase } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import ClientPackagesTab from './ClientPackagesTab';
import TaxSettingsTab from '../../Settings/tabs/TaxSettingsTab';
import { Percent } from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;

const availableFeatures = [
  { id: 'hrms', label: 'HRMS' },
  { id: 'crm', label: 'CRM & Leads' },
  { id: 'website', label: 'Website Builder' },
  { id: 'social', label: 'Social Media' },
  { id: 'ads', label: 'Performance Ads' },
  { id: 'analytics', label: 'Analytics & Attribution' },
  { id: 'chatgpt', label: 'Chatgpt' },
  { id: 'canva', label: 'Canva' },
  { id: 'benchmark', label: 'Benchmark' },
];

const AgencySettingsTab = () => {
  const { user, setUser } = useAuth();
  const { updatePreviewTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formAgency] = Form.useForm();
  const [formAccount] = Form.useForm();
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  useEffect(() => {
    if (user) {
      formAgency.setFieldsValue({
        name: user.companyName || '',
        domain: user.domain || '',
        email: user.contactEmail || '',
        phone: user.supportPhone || '',
        theme_primaryColor: user?.effectiveTheme?.primaryColor || user?.theme?.primaryColor || '#034EA1',
        theme_secondaryColor: user?.effectiveTheme?.secondaryColor || user?.theme?.secondaryColor || '#0ea5e9'
      });
      formAccount.setFieldsValue({
        firstName: (user.name || '').split(' ')[0] || '',
        lastName: (user.name || '').split(' ').slice(1).join(' ') || '',
        email: user.email || ''
      });
    }
  }, [user, formAgency, formAccount]);

  const handleOpenUpgrade = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = async () => {
    if (selectedModules.length === 0) {
      return message.warning('Please select at least one additional module to request.');
    }
    
    try {
      setSubmittingUpgrade(true);
      const moduleLabels = selectedModules.map(id => availableFeatures.find(f => f.id === id)?.label).filter(Boolean);
      const currentPlanName = user?.plan?.name || 'Current Plan';
      
      const title = `Module Upgrade Request`;
      let description = `Agency requested additional modules for their ${currentPlanName} package.\n\n`;
      description += `Additional Modules Requested: ${moduleLabels.join(', ')}`;
      
      await api.post('/sla-success', {
        title,
        description,
        dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
        priority: 'High',
        triggerType: 'Client Issue',
        entityType: 'SupportTicket'
      });
      
      message.success('Upgrade request submitted successfully. Our team will contact you soon.');
      setIsUpgradeModalOpen(false);
      setSelectedModules([]);
    } catch (error) {
      console.error(error);
      message.error(`Failed to submit upgrade request: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  const handleValuesChange = (changedValues) => {
    if (changedValues.theme_primaryColor || changedValues.theme_secondaryColor) {
      const primary = changedValues.theme_primaryColor ? (typeof changedValues.theme_primaryColor === 'string' ? changedValues.theme_primaryColor : changedValues.theme_primaryColor.toHexString()) : null;
      const secondary = changedValues.theme_secondaryColor ? (typeof changedValues.theme_secondaryColor === 'string' ? changedValues.theme_secondaryColor : changedValues.theme_secondaryColor.toHexString()) : null;
      updatePreviewTheme(primary, secondary);
    }
  };

  const handleSaveAgency = async (values) => {
    setLoading(true);
    try {
      const payload = {
        companyName: values.name,
        domain: values.domain,
        contactEmail: values.email,
        supportPhone: values.phone,
        theme: {
          primaryColor: typeof values.theme_primaryColor === 'string' ? values.theme_primaryColor : values.theme_primaryColor?.toHexString(),
          secondaryColor: typeof values.theme_secondaryColor === 'string' ? values.theme_secondaryColor : values.theme_secondaryColor?.toHexString()
        }
      };
      const res = await api.put(`/users/${user._id}`, payload);
      let updatedUser = { ...user, ...res.data.data };
      if (res.data.data.theme) {
        updatedUser.effectiveTheme = res.data.data.theme;
      }
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      message.success('Agency details updated successfully');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update agency details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (values) => {
    setLoading(true);
    try {
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      
      let updated = false;
      let updatedUser = { ...user };
      
      if (fullName && fullName !== user?.name) {
        const res = await api.put(`/users/${user._id}`, { name: fullName });
        updatedUser = res.data.data;
        updated = true;
      }

      if (values.currentPassword && values.newPassword) {
        await api.post('/users/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });
        formAccount.setFieldsValue({ currentPassword: '', newPassword: '' });
        updated = true;
      }

      if (updated) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        message.success('Account details updated successfully');
      } else {
        message.info('No changes made to account details');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update account details');
    } finally {
      setLoading(false);
    }
  };

  const AgencyProfileContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>Agency Profile</Title>
        <Form 
          form={formAgency} 
          layout="vertical" 
          onValuesChange={handleValuesChange}
          onFinish={handleSaveAgency} 
          initialValues={{ 
            name: user?.companyName || '', 
            domain: user?.domain || '', 
            email: user?.contactEmail || '', 
            phone: user?.supportPhone || '',
            theme_primaryColor: user?.effectiveTheme?.primaryColor || user?.theme?.primaryColor || '#034EA1',
            theme_secondaryColor: user?.effectiveTheme?.secondaryColor || user?.theme?.secondaryColor || '#0ea5e9'
          }}
        >
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
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Primary Theme Color</Text>} name="theme_primaryColor">
                <ColorPicker format="hex" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ fontWeight: 600 }}>Secondary Theme Color</Text>} name="theme_secondaryColor">
                <ColorPicker format="hex" />
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
        <Form 
          form={formAccount} 
          layout="vertical" 
          onFinish={handleSaveAccount} 
          initialValues={{ 
            firstName: (user?.name || '').split(' ')[0] || '', 
            lastName: (user?.name || '').split(' ').slice(1).join(' ') || '', 
            email: user?.email || '' 
          }}
        >
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

  const SubscriptionContent = () => {
    const plan = user?.plan || {};
    
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Current Plan</Title>
              <Text type="secondary">You are currently on the <strong style={{ color: 'var(--text-primary)' }}>{plan.name || 'Pro Agency'}</strong> plan.</Text>
            </div>
            <Tag color="success" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 14, fontWeight: 600, border: '1px solid var(--accent-secondary)', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-secondary)' }}>
              <Star size={14} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} /> Active
            </Tag>
          </div>
          
          <Divider />
          
          <Row gutter={[24, 24]}>
            <Col xs={24} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Price / Cycle</Text>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>{plan.price || 'Custom'}</Text>
            </Col>
            <Col xs={24} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Allowed Users</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} color="var(--text-secondary)" />
                <Text style={{ fontSize: 16, fontWeight: 600 }}>{plan.users || 5}</Text>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Allowed Clients</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={16} color="var(--text-secondary)" />
                <Text style={{ fontSize: 16, fontWeight: 600 }}>{plan.clients || 10}</Text>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Subscription Date</Text>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>
                {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </Col>
          </Row>

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <Button type="primary" onClick={handleOpenUpgrade} loading={loading} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }} size="large">Upgrade Plan</Button>
        </div>
      </Card>
    </motion.div>
  );
};

  const baseItems = [
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
    {
      key: 'client-packages',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={16} /> Client Packages</span>,
      children: <ClientPackagesTab />,
    },
    {
      key: 'tax-settings',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Percent size={16} /> Tax Settings</span>,
      children: <TaxSettingsTab />,
    },
  ];

  const items = user?.role === 'agency_manager' 
    ? baseItems.filter(item => ['account', 'client-packages', 'tax-settings'].includes(item.key))
    : baseItems;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Settings</Title>
        <Text type="secondary">Manage your agency preferences and configurations.</Text>
      </div>
      
      <Tabs 
        defaultActiveKey={items[0]?.key || "account"} 
        items={items} 
        animated={{ inkBar: true, tabPane: true }}
        size="large"
        tabBarStyle={{ marginBottom: 24, fontWeight: 600 }}
      />
      
      <Modal
        title="Upgrade Your Plan"
        open={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        onOk={handleUpgradeSubmit}
        confirmLoading={submittingUpgrade}
        okText="Submit Request"
        okButtonProps={{ style: { background: 'var(--accent-primary)' } }}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            Please select the additional modules you require. Our team will reach out to discuss pricing and complete the setup.
          </Text>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Additional Modules</label>
            <Checkbox.Group 
              style={{ width: '100%' }} 
              value={[...(user?.features || []), ...selectedModules]}
              onChange={(checkedValues) => {
                // Filter out the ones already in the plan
                const newModules = checkedValues.filter(v => !(user?.features || []).includes(v));
                setSelectedModules(newModules);
              }}
            >
              <Row gutter={[16, 16]}>
                {availableFeatures.map(feat => {
                  const isAlreadyInPlan = user?.features?.includes(feat.id);
                  return (
                    <Col span={12} key={feat.id}>
                      <Checkbox value={feat.id} disabled={isAlreadyInPlan}>
                        {feat.label} {isAlreadyInPlan && <Text type="secondary" style={{fontSize: 12}}>(Included)</Text>}
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AgencySettingsTab;
