import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Form, Input, Switch, Select, Space, Divider, message, Alert, InputNumber } from 'antd';
import { Settings, Save } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;
const { Option } = Select;

const EcommerceSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { workspaceId, websiteId, activeStoreId } = useEcommerce();

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getSettings(workspaceId, websiteId, activeStoreId);
      form.setFieldsValue(data);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => { if (!e.detail?.entity || e.detail?.entity === 'settings') loadData(); };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId, form]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await saveSettings(workspaceId, websiteId, activeStoreId, values);
      message.success('Settings saved successfully');
    } catch (e) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!activeStoreId) {
    return <div style={{ padding: 24 }}><Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store to edit settings." showIcon /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} color="var(--accent-primary)" /> Store Settings
          </Title>
          <Text type="secondary">Configure store preferences and payment/shipping methods</Text>
        </div>
        <Button type="primary" icon={<Save size={16} />} loading={loading} onClick={() => form.submit()}>
          Save Settings
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card title="General Settings" style={{ marginBottom: 24 }}>
          <Form.Item name="storeName" label="Store Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="storeDescription" label="Store Description">
            <Input.TextArea />
          </Form.Item>
          <Space size="large">
            <Form.Item name="currency" label="Currency Code" rules={[{ required: true }]}>
              <Select style={{ width: 120 }}>
                <Option value="USD">USD</Option>
                <Option value="EUR">EUR</Option>
                <Option value="GBP">GBP</Option>
                <Option value="INR">INR</Option>
                <Option value="AUD">AUD</Option>
              </Select>
            </Form.Item>
            <Form.Item name="currencySymbol" label="Currency Symbol" rules={[{ required: true }]}>
              <Input style={{ width: 100 }} />
            </Form.Item>
          </Space>
        </Card>

        <Card title="Shipping & Taxes" style={{ marginBottom: 24 }}>
          <Form.Item name="shippingEnabled" label="Enable Shipping" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="shippingFee" label="Flat Shipping Fee">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
        </Card>

        {/* Keeping UI simple for MVP: only COD for now */}
        <Card title="Payment Methods">
          <Text type="secondary">Currently only Cash on Delivery (COD) is supported natively.</Text>
        </Card>
      </Form>
    </div>
  );
};

export default EcommerceSettings;
