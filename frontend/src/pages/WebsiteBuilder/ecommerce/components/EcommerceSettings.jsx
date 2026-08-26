import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Switch, Card, Typography, message, Select, Row, Col } from 'antd';
import { Save } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;
const { Option } = Select;

const EcommerceSettings = () => {
  const [form] = Form.useForm();
  const { workspaceId, websiteId } = useEcommerce();
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    if (workspaceId && websiteId) {
      const currentSettings = getSettings(workspaceId, websiteId);
      form.setFieldsValue(currentSettings);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (workspaceId && websiteId) {
        const data = await getSettings(workspaceId, websiteId);
        form.setFieldsValue(data);
      }
    };
    loadData();
    const handleSync = (e) => {
      if (e.detail?.entity === 'settings') loadData();
    };
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId, form]);

  const onFinish = async (values) => {
    setLoading(true);
    await saveSettings(workspaceId, websiteId, values);
    message.success('Settings saved successfully');
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Store Settings</Title>
        <Text type="secondary">Configure global settings for your e-commerce store</Text>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ currency: 'INR', currencySymbol: '₹', shippingEnabled: true }}
        >
          <Title level={5}>General Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storeName" label="Store Name" rules={[{ required: true }]}>
                <Input placeholder="My Awesome Store" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="storeDescription" label="Store Description">
                <Input placeholder="A short description of your store" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 24 }}>Currency</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currency" label="Currency Code" rules={[{ required: true }]}>
                <Select>
                  <Option value="INR">INR (₹)</Option>
                  <Option value="USD">USD ($)</Option>
                  <Option value="EUR">EUR (€)</Option>
                  <Option value="GBP">GBP (£)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currencySymbol" label="Currency Symbol" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 24 }}>Shipping</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shippingEnabled" label="Enable Shipping Fee" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shippingFee" label="Flat Shipping Fee">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 24 }}>Payment Methods</Title>
          <Form.List name="paymentMethods">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Missing method name' }]}
                    >
                      <Input placeholder="Method Name (e.g., COD)" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'id']}
                      rules={[{ required: true, message: 'Missing method ID' }]}
                    >
                      <Input placeholder="ID (e.g., cod)" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'enabled']}
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                    </Form.Item>
                  </Space>
                ))}
              </>
            )}
          </Form.List>

          <Title level={5} style={{ marginTop: 24 }}>Shipping Methods</Title>
          <Form.List name="shippingMethods">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Missing name' }]}
                    >
                      <Input placeholder="Method Name" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      rules={[{ required: true, message: 'Missing price' }]}
                    >
                      <InputNumber placeholder="Price" min={0} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'enabled']}
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ enabled: true, price: 0 })} block>
                    Add Shipping Method
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Title level={5} style={{ marginTop: 24 }}>Branding (Fallback)</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="primaryColor" label="Primary Color">
                <Input type="color" style={{ width: '100%', height: 40, padding: 4 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secondaryColor" label="Secondary Color">
                <Input type="color" style={{ width: '100%', height: 40, padding: 4 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={loading}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EcommerceSettings;
