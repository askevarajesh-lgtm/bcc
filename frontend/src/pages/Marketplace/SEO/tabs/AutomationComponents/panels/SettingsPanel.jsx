import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Button, Typography, message, Divider, Space } from 'antd';
import { Settings, Save, ShieldAlert, Cpu } from 'lucide-react';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;

export default function SettingsPanel({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { isDark } = useTheme();
  const cardBg  = isDark ? '#111c31' : '#ffffff';
  const cardBdr = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';

  const handleSave = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Automation engine settings updated successfully!');
    }, 600);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Automation Engine Settings</Title>
        <Text type="secondary">Configure execution concurrency, retry thresholds, and worker recovery parameters</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 10, background: cardBg, border: cardBdr }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            maxConcurrency: 10,
            defaultTimeoutMs: 30000,
            defaultRetries: 3,
            dlqRetentionDays: 30,
            enableHeartbeatMonitoring: true,
            autoRecoveryEnabled: true
          }}
        >
          <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Cpu size={16} color="#2563eb" /> Concurrency & Queueing
          </Title>
          <Form.Item name="maxConcurrency" label="Max Concurrent Workflows per Project">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defaultTimeoutMs" label="Execution Timeout (ms)">
            <InputNumber min={5000} max={120000} step={5000} style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <ShieldAlert size={16} color="#d97706" /> Failure Resilience & Recovery
          </Title>
          <Form.Item name="defaultRetries" label="Default Node Retries on Error">
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dlqRetentionDays" label="Dead Letter Queue (DLQ) Retention (Days)">
            <InputNumber min={7} max={90} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enableHeartbeatMonitoring" label="Worker Heartbeat Health Check" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="autoRecoveryEnabled" label="Auto-Recover Stalled Executions" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<Save size={14} />} loading={loading} style={{ background: '#2563eb', marginTop: 12 }}>
            Save Engine Configuration
          </Button>
        </Form>
      </Card>
    </div>
  );
}
