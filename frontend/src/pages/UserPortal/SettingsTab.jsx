import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, message, Avatar, Divider, Upload } from 'antd';
import { motion } from 'framer-motion';
import { User, Lock, Save, Mail, Building, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { Title, Text } = Typography;

const UserSettingsTab = () => {
  const { role } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const { user, setUser } = useAuth();

  useEffect(() => {
    form.setFieldsValue({
      name: user.name || '',
      email: user.email || '',
      companyName: user.companyName || ''
    });
    if (user.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id || user._id}`, values);
      message.success('Profile updated successfully');
      // Update local storage user
      const updatedUser = { ...user, ...res.data.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'user-avatars');

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        const url = res.data.data.url;
        setAvatarPreview(url);
        
        // Auto-save the avatar to the DB
        const updateRes = await api.put(`/users/${user.id || user._id}`, { avatar: url });
        
        if (updateRes.data && updateRes.data.data) {
          const updatedUser = { ...user, ...updateRes.data.data };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        onSuccess(res.data);
        message.success('Profile picture updated successfully.');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      onError(error);
      message.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPwdLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      <Card 
        className="glassmorphism" 
        style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)' }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ position: 'relative' }}>
            <Avatar src={avatarPreview} size={80} style={{ backgroundColor: 'var(--accent-primary)', fontSize: 32, fontWeight: 800 }}>
              {!avatarPreview && (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </Avatar>
            <Upload customRequest={customUpload} showUploadList={false} accept="image/*">
              <Button 
                shape="circle" 
                icon={<Camera size={14} />} 
                loading={uploadingAvatar}
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: -4, 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </Upload>
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{user.name || 'User'}</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>{user.email}</Text>
            <div style={{ marginTop: 8 }}>
              <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Role: {user.roleName || role}
              </span>
              {(user.agencyName || user.companyName) && (
                <span style={{ marginLeft: 8, background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Agency: {user.agencyName || user.companyName}
                </span>
              )}
              {user.brandName && (
                <span style={{ marginLeft: 8, background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Brand: {user.brandName}
                </span>
              )}
            </div>
          </div>
        </div>

        <Divider style={{ borderColor: 'var(--border-color)', margin: '0 0 32px 0' }} />

        <Title level={5} style={{ fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="var(--accent-primary)" /> Personal Information
        </Title>
        
        <Form form={form} layout="vertical" onFinish={handleUpdateProfile} requiredMark={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label={<strong style={{ color: 'var(--text-secondary)' }}>Full Name</strong>} rules={[{ required: true }]}>
              <Input size="large" prefix={<User size={16} color="var(--text-tertiary)" />} style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
            </Form.Item>
            <Form.Item name="email" label={<strong style={{ color: 'var(--text-secondary)' }}>Email Address</strong>} rules={[{ required: true, type: 'email' }]}>
              <Input size="large" prefix={<Mail size={16} color="var(--text-tertiary)" />} style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
            </Form.Item>
          </div>
          <Form.Item name="companyName" label={<strong style={{ color: 'var(--text-secondary)' }}>Company / Department</strong>}>
            <Input size="large" prefix={<Building size={16} color="var(--text-tertiary)" />} style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<Save size={16} />} style={{ background: 'var(--accent-primary)', height: 40, borderRadius: 8, fontWeight: 600 }}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card 
        className="glassmorphism" 
        style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}
        bodyStyle={{ padding: 32 }}
      >
        <Title level={5} style={{ fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="var(--accent-warning)" /> Security
        </Title>
        
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
          <Form.Item name="currentPassword" label={<strong style={{ color: 'var(--text-secondary)' }}>Current Password</strong>} rules={[{ required: true }]}>
            <Input.Password size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="newPassword" label={<strong style={{ color: 'var(--text-secondary)' }}>New Password</strong>} rules={[{ required: true, min: 6 }]}>
              <Input.Password size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
            </Form.Item>
            <Form.Item 
              name="confirmPassword" 
              label={<strong style={{ color: 'var(--text-secondary)' }}>Confirm New Password</strong>} 
              dependencies={['newPassword']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)' }} />
            </Form.Item>
          </div>
          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" loading={pwdLoading} icon={<Save size={16} />} style={{ background: 'var(--accent-warning)', border: 'none', height: 40, borderRadius: 8, fontWeight: 600 }}>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  );
};

export default UserSettingsTab;
