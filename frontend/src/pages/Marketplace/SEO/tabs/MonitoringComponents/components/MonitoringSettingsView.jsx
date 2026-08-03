import React, { useState } from 'react';
import { Card, Form, Select, InputNumber, Switch, Button, Typography, message, Divider, Space, Tag } from 'antd';
import { Settings, Save, Bell, Shield, Activity, Globe } from 'lucide-react';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

export default function MonitoringSettingsView({ project }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { isDark } = useTheme();
  const cardBg  = isDark ? '#111c31' : '#ffffff';
  const cardBdr = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';

  const handleSave = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Monitoring engine schedules and alert thresholds updated!');
    }, 600);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Enterprise Monitoring Settings</Title>
        <Text type="secondary">Configure automatic scan frequencies, alert trigger thresholds, and multi-channel routing</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, border: cardBdr, background: cardBg }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            scanInterval: 'daily',
            uptimeCheckFrequencyMinutes: 5,
            rankDropThreshold: 3,
            lcpThresholdSeconds: 2.5,
            alertOnCriticalOnly: false,
            notifySlack: true,
            notifyEmail: true
          }}
        >
          <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Activity size={16} color="#2563eb" /> Scan Frequency & Intervals
          </Title>
          <Form.Item name="scanInterval" label="Full 11-Plugin Scan Frequency">
            <Select>
              <Option value="hourly">Every Hour (Ultra-High Surveillance)</Option>
              <Option value="every_6_hours">Every 6 Hours</Option>
              <Option value="daily">Daily (Recommended)</Option>
              <Option value="weekly">Weekly</Option>
            </Select>
          </Form.Item>
          <Form.Item name="uptimeCheckFrequencyMinutes" label="Endpoint Ping & TTFB Interval (Minutes)">
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Shield size={16} color="#d97706" /> Sensitivity & Alert Thresholds
          </Title>
          <Form.Item name="rankDropThreshold" label="Keyword Position Drop Alert Trigger (Positions)">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lcpThresholdSeconds" label="Core Web Vitals LCP Degradation Alert (Seconds)">
            <InputNumber min={1.0} max={10.0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Bell size={16} color="#7c3aed" /> Notification Routing
          </Title>
          <Form.Item name="notifySlack" label="Dispatch Alerts to Slack Channel" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notifyEmail" label="Dispatch Digest to Project Team Emails" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<Save size={14} />} loading={loading} style={{ background: '#2563eb', marginTop: 12 }}>
            Save Monitoring Configuration
          </Button>
        </Form>
      </Card>
    </div>
  );
}
