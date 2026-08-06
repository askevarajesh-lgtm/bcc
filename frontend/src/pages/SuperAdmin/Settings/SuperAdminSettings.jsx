import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Upload, Spin, Row, Col, Typography } from 'antd';
import { User, Lock, Upload as UploadIcon } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

const { Title, Text } = Typography;

const SuperAdminSettings = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, login } = useAuth();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/profile');
      if (res.data.success) {
        const profile = res.data.data;
        profileForm.setFieldsValue({
          companyName: profile.companyName,
          email: profile.email,
          phone: profile.phone,
          domain: profile.domain
        });
        setLogoUrl(profile.logo);
        setLogoDarkUrl(profile.logoDark);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);
      const res = await api.put('/superadmin/profile', {
        ...values,
        logo: logoUrl,
        logoDark: logoDarkUrl
      });
      if (res.data.success) {
        message.success('Profile updated successfully');
        // Update user context if needed, though most fields might not be in auth context directly
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      return message.error('Passwords do not match');
    }
    try {
      setPasswordLoading(true);
      const res = await api.put('/superadmin/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      if (res.data.success) {
        message.success('Password changed successfully');
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const url = res.data.data?.url || res.data.url;
        setLogoUrl(url);
        message.success('Light mode logo uploaded successfully. Don\'t forget to save changes.');
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDarkLogoUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploadingDark(true);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const url = res.data.data?.url || res.data.url;
        setLogoDarkUrl(url);
        message.success('Dark mode logo uploaded successfully. Don\'t forget to save changes.');
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error('Failed to upload dark logo');
    } finally {
      setUploadingDark(false);
    }
  };

  const items = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} /> Profile
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Profile Details" bordered={false} className="bcc-card">
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <Form.Item name="companyName" label="Company Name">
                  <Input placeholder="Enter company name" />
                </Form.Item>
                <Form.Item name="email" label="Email Address" rules={[{ type: 'email' }]}>
                  <Input placeholder="Enter email address" />
                </Form.Item>
                <Form.Item name="phone" label="Phone Number">
                  <Input placeholder="Enter phone number" />
                </Form.Item>
                <Form.Item name="domain" label="Website URL">
                  <Input placeholder="https://example.com" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Platform Logo" bordered={false} className="bcc-card">
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>Light Mode Logo</Text>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Light" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Text type="secondary">No light logo</Text>
                    </div>
                  )}
                </div>
                <Upload
                  customRequest={handleLogoUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadIcon size={16} />} loading={uploading} block>
                    {logoUrl ? 'Change Light Logo' : 'Upload Light Logo'}
                  </Button>
                </Upload>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>Dark Mode Logo</Text>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  {logoDarkUrl ? (
                    <img src={logoDarkUrl} alt="Logo Dark" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Text type="secondary">No dark logo</Text>
                    </div>
                  )}
                </div>
                <Upload
                  customRequest={handleDarkLogoUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadIcon size={16} />} loading={uploadingDark} block>
                    {logoDarkUrl ? 'Change Dark Logo' : 'Upload Dark Logo'}
                  </Button>
                </Upload>
              </div>

              <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12, textAlign: 'center' }}>
                These logos will automatically adapt on the platform Sign In page.
              </Text>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} /> Security
        </span>
      ),
      children: (
        <Card title="Change Password" bordered={false} className="bcc-card" style={{ maxWidth: 600 }}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordUpdate}
          >
            <Form.Item 
              name="currentPassword" 
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password placeholder="Enter current password" />
            </Form.Item>
            
            <Form.Item 
              name="newPassword" 
              label="New Password"
              rules={[{ required: true, message: 'Please enter a new password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
            >
              <Input.Password placeholder="Enter new password" />
            </Form.Item>
            
            <Form.Item 
              name="confirmPassword" 
              label="Confirm New Password"
              rules={[{ required: true, message: 'Please confirm your new password' }]}
            >
              <Input.Password placeholder="Confirm new password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                Update Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Super Admin Settings</Title>
        <Text type="secondary">Manage your platform profile and security settings.</Text>
      </div>

      {loading && !profileForm.getFieldValue('email') ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs items={items} />
      )}
    </div>
  );
};

export default SuperAdminSettings;
