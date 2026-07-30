import React, { useEffect, useState } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Tag, Skeleton, Alert } from 'antd';
import { Settings, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';

const { Title, Text } = Typography;

const SettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.getSettingsStatus();
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await seoWorkspaceApi.saveSettings({ anthropicApiKey: values.anthropicApiKey });
      message.success('Settings saved successfully');
      form.resetFields();
      await load();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Settings size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Settings</Title>
          <Text type="secondary">Workspace-level configuration for the SEO agents.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Card size="small" title={<Space><KeyRound size={16} /> Anthropic API Key</Space>} style={{ maxWidth: 560 }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Space>
              <Text>Status:</Text>
              {status?.isAnthropicConfigured
                ? <Tag color="green">Configured ({status.maskedAnthropicKey})</Tag>
                : <Tag color="default">Not configured</Tag>}
            </Space>

            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Form.Item
                name="anthropicApiKey"
                label={status?.isAnthropicConfigured ? 'Replace API key' : 'API key'}
                rules={[{ required: !status?.isAnthropicConfigured, message: 'Enter an API key' }]}
              >
                <Input.Password placeholder="sk-ant-..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
            </Form>
          </Space>
        )}
      </Card>
    </motion.div>
  );
};

export default SettingsTab;