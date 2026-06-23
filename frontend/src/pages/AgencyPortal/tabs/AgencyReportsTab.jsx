import React, { useState } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Button, Input, Select, Modal, Form, Dropdown, message, Avatar } from 'antd';
import { motion } from 'framer-motion';
import { Download, Plus, FileText, BarChart2, Calendar, MoreVertical, Edit2, Trash2, Send, Filter } from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;

const AgencyReportsTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  // Mock Data
  const reports = [
    { id: 1, name: 'Q1 Marketing Performance', client: 'Acme Corp', type: 'Comprehensive', frequency: 'Quarterly', lastGenerated: '2026-04-01', status: 'ready' },
    { id: 2, name: 'Monthly SEO Overview', client: 'Stark Industries', type: 'SEO', frequency: 'Monthly', lastGenerated: '2026-06-01', status: 'ready' },
    { id: 3, name: 'Weekly Ad Spend', client: 'Wayne Enterprises', type: 'Paid Ads', frequency: 'Weekly', lastGenerated: '2026-06-20', status: 'processing' },
    { id: 4, name: 'Social Media Engagement', client: 'Acme Corp', type: 'Social', frequency: 'Monthly', lastGenerated: '2026-06-01', status: 'ready' },
  ];

  const handleCreate = () => {
    message.success('Report schedule created successfully!');
    setIsModalOpen(false);
    form.resetFields();
  };

  const getActionMenu = (record) => [
    { key: 'view', icon: <FileText size={16} />, label: 'View Report' },
    { key: 'download', icon: <Download size={16} />, label: 'Download PDF' },
    { key: 'send', icon: <Send size={16} />, label: 'Email to Client' },
    { type: 'divider' },
    { key: 'edit', icon: <Edit2 size={16} />, label: 'Edit Schedule' },
    { key: 'delete', icon: <Trash2 size={16} />, label: 'Delete Report', danger: true },
  ];

  const columns = [
    {
      title: 'REPORT NAME',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{text}</strong>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.type}</Text>
        </div>
      )
    },
    {
      title: 'CLIENT',
      dataIndex: 'client',
      key: 'client',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ backgroundColor: 'var(--accent-primary)' }}>{text.charAt(0)}</Avatar>
          <Text>{text}</Text>
        </div>
      )
    },
    {
      title: 'FREQUENCY',
      dataIndex: 'frequency',
      key: 'frequency',
      render: text => <Tag style={{ borderRadius: 12 }}>{text}</Tag>
    },
    {
      title: 'LAST GENERATED',
      dataIndex: 'lastGenerated',
      key: 'lastGenerated',
      render: text => <Text type="secondary">{new Date(text).toLocaleDateString()}</Text>
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: text => {
        let color = text === 'ready' ? 'success' : 'processing';
        return <Tag color={color} style={{ borderRadius: 12, border: `1px solid var(--accent-${color === 'success' ? 'secondary' : 'primary'})`, background: 'transparent', color: `var(--accent-${color === 'success' ? 'secondary' : 'primary'})` }}>{text.toUpperCase()}</Tag>
      }
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreVertical size={16} />} />
        </Dropdown>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Client Reports</Title>
          <Text type="secondary">Automate, generate, and manage performance reports for your clients.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon={<Download size={16} />} style={{ borderRadius: 8 }}>Export All</Button>
          <Button type="primary" onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />} style={{ borderRadius: 8, background: 'var(--accent-primary)', fontWeight: 600 }}>
            Create Report
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'TOTAL REPORTS', val: '42', icon: <FileText size={20} />, color: 'var(--accent-primary)' },
          { label: 'AUTOMATED', val: '38', icon: <Calendar size={20} />, color: 'var(--accent-secondary)' },
          { label: 'PROCESSING', val: '4', icon: <BarChart2 size={20} />, color: 'var(--accent-warning)' },
        ].map((kpi, i) => (
          <Col xs={24} md={8} key={i}>
            <Card 
              className="glassmorphism" 
              bodyStyle={{ padding: '24px' }} 
              style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>{kpi.label}</Text>
                <div style={{ padding: 8, borderRadius: 10, backgroundColor: 'var(--bg-secondary)', color: kpi.color, border: '1px solid var(--border-color)' }}>
                  {kpi.icon}
                </div>
              </div>
              <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>{kpi.val}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <Input.Search placeholder="Search reports..." style={{ maxWidth: 300 }} />
          <Button icon={<Filter size={16} />}>Filter</Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={reports} 
          rowKey="id" 
          pagination={{ pageSize: 5 }} 
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Create New Report</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="glass-modal"
        centered
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 24 }}>
          <Form.Item label={<Text style={{ fontWeight: 600 }}>Report Name</Text>} name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Monthly SEO Performance" style={{ borderRadius: 8 }} size="large" />
          </Form.Item>
          
          <Form.Item label={<Text style={{ fontWeight: 600 }}>Select Client</Text>} name="client" rules={[{ required: true }]}>
            <Select placeholder="Select a client" size="large">
              <Option value="1">Acme Corp</Option>
              <Option value="2">Stark Industries</Option>
              <Option value="3">Wayne Enterprises</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={<Text style={{ fontWeight: 600 }}>Data Sources to Include</Text>} name="sources">
            <Select mode="multiple" placeholder="Select data sources" size="large">
              <Option value="seo">SEO Metrics (Google Analytics)</Option>
              <Option value="ads">Paid Ads (Google Ads, Meta)</Option>
              <Option value="social">Social Media (LinkedIn, Twitter)</Option>
              <Option value="crm">CRM Leads</Option>
            </Select>
          </Form.Item>

          <Form.Item label={<Text style={{ fontWeight: 600 }}>Generation Frequency</Text>} name="frequency" rules={[{ required: true }]}>
            <Select placeholder="Select frequency" size="large">
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
              <Option value="quarterly">Quarterly</Option>
              <Option value="onetime">One-time only</Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600 }} size="large">Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }} size="large">Schedule Report</Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AgencyReportsTab;
