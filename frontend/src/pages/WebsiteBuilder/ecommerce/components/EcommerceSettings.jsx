import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, message } from 'antd';
import { getStorageData, setStorageData } from '../utils/storage';

const { Title } = Typography;
const { Option } = Select;

const EcommerceSettings = () => {
  const [form] = Form.useForm();
  
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    const settings = getStorageData(workspaceId, websiteId, 'settings', {
      currency: 'INR',
      currencySymbol: '₹',
      storeName: 'My Awesome Store',
      storeDescription: 'The best place to buy things.',
    });
    form.setFieldsValue(settings);
  }, [form]);

  const onFinish = (values) => {
    const symbolMap = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    const settings = {
      ...values,
      currencySymbol: symbolMap[values.currency] || '$'
    };
    
    setStorageData(workspaceId, websiteId, 'settings', settings);
    message.success('Settings saved successfully');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>Store Settings</Title>
      
      <Card style={{ maxWidth: 600 }}>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
        >
          <Form.Item name="storeName" label="Store Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="storeDescription" label="Store Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
            <Select>
              <Option value="INR">INR (₹)</Option>
              <Option value="USD">USD ($)</Option>
              <Option value="EUR">EUR (€)</Option>
              <Option value="GBP">GBP (£)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">Save Settings</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EcommerceSettings;
