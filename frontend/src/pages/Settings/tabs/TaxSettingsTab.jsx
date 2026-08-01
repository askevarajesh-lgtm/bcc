import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, Switch, Typography, message, Space, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text } = Typography;

const TaxSettingsTab = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxSettings, setTaxSettings] = useState({ gstPercentage: 18, gstEnabled: false });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch('/api/agency/settings/profile', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const settings = data.data.taxSettings || { gstPercentage: 18, gstEnabled: false };
        setTaxSettings(settings);
        form.setFieldsValue({ gstPercentage: settings.gstPercentage });
      }
    } catch (error) {
      console.error('Failed to fetch tax settings:', error);
      message.error("Failed to load tax settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const updatedSettings = {
        ...taxSettings,
        gstPercentage: values.gstPercentage
      };

      const res = await fetch('/api/agency/settings/profile', {
        method: 'PUT',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ taxSettings: updatedSettings })
      });
      
      const data = await res.json();
      if (data.success) {
        setTaxSettings(updatedSettings);
        setIsEditing(false);
        message.success("Tax percentage updated successfully.");
      } else {
        message.error(data.message || "Failed to update tax percentage.");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const toggleGstEnabled = async (checked) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const updatedSettings = {
        ...taxSettings,
        gstEnabled: checked
      };

      const res = await fetch('/api/agency/settings/profile', {
        method: 'PUT',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ taxSettings: updatedSettings })
      });
      
      const data = await res.json();
      if (data.success) {
        setTaxSettings(updatedSettings);
        message.success(`GST ${checked ? 'enabled' : 'disabled'} successfully.`);
      } else {
        message.error(data.message || "Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card style={{ maxWidth: 600, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {isEditing ? (
          <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ gstPercentage: taxSettings.gstPercentage }}>
            <Form.Item 
              label={<span style={{ fontWeight: 500, color: '#f5222d' }}>* GST Percentage</span>} 
              name="gstPercentage"
              rules={[{ required: true, message: 'Please enter a percentage' }]}
              tooltip="Enter the GST percentage to be applied on invoices."
            >
              <InputNumber 
                style={{ width: 150 }} 
                min={0} 
                max={100} 
                addonAfter="%" 
                step={0.01} 
              />
            </Form.Item>
            
            <Space style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#c8232c', borderColor: '#c8232c' }}>
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </Space>
          </Form>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Text type="secondary">Tax type :</Text>
                <Text strong>GST</Text>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Text type="secondary">GST percentage :</Text>
                <Text strong>{taxSettings.gstPercentage}%</Text>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Text type="secondary">Status :</Text>
                <Text strong style={{ color: taxSettings.gstEnabled ? '#52c41a' : '#f5222d' }}>
                  {taxSettings.gstEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8 }}>
                <Space>
                  <Switch 
                    checked={taxSettings.gstEnabled} 
                    onChange={toggleGstEnabled}
                    loading={saving}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    style={taxSettings.gstEnabled ? { background: '#c8232c' } : undefined}
                  />
                  <Text>{taxSettings.gstEnabled ? 'Enable GST' : 'Enable GST'}</Text>
                </Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                  Edit percentage
                </Button>
              </div>
            </Space>
          </div>
        )}

        <div style={{ background: '#f5f7fa', padding: '16px 20px', borderRadius: 8 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>How it works</Text>
          <ul style={{ paddingLeft: 20, margin: 0, color: 'rgba(0, 0, 0, 0.65)', fontSize: 13, lineHeight: '22px' }}>
            <li>Only <strong>GST</strong> is supported (CGST+SGST or IGST as per client state).</li>
            <li>When <strong>OFF</strong>: No tax is applied to invoices.</li>
            <li>When <strong>ON</strong>: Tax is calculated as (Subtotal × GST%).</li>
            <li>Total = Subtotal + GST. Changes apply to new invoices only.</li>
          </ul>
        </div>
        
      </Card>
    </motion.div>
  );
};

export default TaxSettingsTab;
