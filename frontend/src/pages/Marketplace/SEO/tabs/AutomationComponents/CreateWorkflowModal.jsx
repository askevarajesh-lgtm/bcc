import React, { useState } from 'react';
import { Modal, Form, Input, Select, Radio, Typography, Space, Button } from 'antd';
import { Plus, Sparkles, Layout, Clock, Zap, Layers, FileText } from 'lucide-react';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CreateWorkflowModal({ visible, onCancel, onCreate }) {
  const [form] = Form.useForm();
  const [startType, setStartType] = useState('blank');
  const { isDark } = useTheme();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onCreate({
        name: values.name.trim(),
        category: values.category || 'Website Audit',
        triggerType: values.triggerType || 'schedule',
        description: values.description?.trim() || '',
        startType: startType,
        aiPrompt: values.aiPrompt?.trim() || ''
      });
      form.resetFields();
      setStartType('blank');
    } catch (err) {
      // Form validation failed
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setStartType('blank');
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Plus size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Create New Automation Workflow</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>Configure workflow details before entering the visual builder</div>
          </div>
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create & Open Studio"
      cancelText="Cancel"
      width={560}
      destroyOnClose
      okButtonProps={{ style: { background: '#2563eb' } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          category: 'Website Audit',
          triggerType: 'schedule',
          description: ''
        }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 600 }}>Workflow Name</span>}
          rules={[
            { required: true, message: 'Please provide a name for your workflow' },
            { min: 3, message: 'Workflow name must be at least 3 characters' }
          ]}
        >
          <Input 
            placeholder="e.g. Daily 19:00 Site Audit & Slack Alert" 
            autoFocus 
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            name="category"
            label={<span style={{ fontWeight: 600 }}>SEO Module / Category</span>}
            rules={[{ required: true }]}
          >
            <Select size="middle" style={{ width: '100%' }}>
              <Option value="Website Audit">Website Audit</Option>
              <Option value="Technical SEO">Technical SEO</Option>
              <Option value="Keywords & Rankings">Keywords & Rankings</Option>
              <Option value="Competitor Analysis">Competitor Analysis</Option>
              <Option value="Content AI">Content AI</Option>
              <Option value="AEO / LLM Citations">AEO / LLM Citations</Option>
              <Option value="GEO / Entity SEO">GEO / Entity SEO</Option>
              <Option value="Schema Markup">Schema Markup</Option>
              <Option value="Internal Linking">Internal Linking</Option>
              <Option value="Image SEO">Image SEO</Option>
              <Option value="Monitoring & Uptime">Monitoring & Uptime</Option>
              <Option value="Executive Reports">Executive Reports</Option>
              <Option value="General">General / Multi-Module</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="triggerType"
            label={<span style={{ fontWeight: 600 }}>Primary Trigger Mechanism</span>}
            rules={[{ required: true }]}
          >
            <Select size="middle" style={{ width: '100%' }}>
              <Option value="schedule">Schedule / Recurring Cron</Option>
              <Option value="event">Domain Event / Metric Anomaly</Option>
              <Option value="webhook">Incoming Webhook POST</Option>
              <Option value="manual">Manual / On-Demand</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label={<span style={{ fontWeight: 600 }}>Description (Optional)</span>}
        >
          <Input.TextArea
            rows={2}
            placeholder="Brief description of what this automated workflow accomplishes..."
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item label={<span style={{ fontWeight: 600 }}>How would you like to start?</span>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div
              onClick={() => setStartType('blank')}
              style={{
                border: `2px solid ${startType === 'blank' ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0'}`,
                background: startType === 'blank' ? (isDark ? '#1e293b' : '#eff6ff') : (isDark ? '#0f172a' : '#ffffff'),
                padding: '12px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Layout size={20} color={startType === 'blank' ? '#3b82f6' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: startType === 'blank' ? '#3b82f6' : 'inherit' }}>Blank Canvas</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Build custom from scratch</div>
            </div>

            <div
              onClick={() => setStartType('starter')}
              style={{
                border: `2px solid ${startType === 'starter' ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0'}`,
                background: startType === 'starter' ? (isDark ? '#1e293b' : '#eff6ff') : (isDark ? '#0f172a' : '#ffffff'),
                padding: '12px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={20} color={startType === 'starter' ? '#3b82f6' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: startType === 'starter' ? '#3b82f6' : 'inherit' }}>Starter Nodes</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Pre-wired trigger & action</div>
            </div>

            <div
              onClick={() => setStartType('ai')}
              style={{
                border: `2px solid ${startType === 'ai' ? '#8b5cf6' : isDark ? '#334155' : '#e2e8f0'}`,
                background: startType === 'ai' ? (isDark ? '#2e1065' : '#f5f3ff') : (isDark ? '#0f172a' : '#ffffff'),
                padding: '12px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={20} color={startType === 'ai' ? '#8b5cf6' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: startType === 'ai' ? '#8b5cf6' : 'inherit' }}>AI Generator</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Prompt to full DAG</div>
            </div>
          </div>
        </Form.Item>

        {startType === 'ai' && (
          <Form.Item
            name="aiPrompt"
            label={<span style={{ fontWeight: 600, color: '#8b5cf6' }}>AI Workflow Prompt</span>}
            rules={[{ required: true, message: 'Please describe the workflow you want AI to generate' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe your workflow in natural language, e.g. Crawl my site every Monday, analyze Core Web Vitals, and send an email report if score drops below 90."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
