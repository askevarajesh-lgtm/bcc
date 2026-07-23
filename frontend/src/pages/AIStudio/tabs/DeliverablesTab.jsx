import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Tag, Modal, Form, Input, DatePicker, Select, message, Space } from 'antd';
import { Plus, Eye, Send } from 'lucide-react';
import api from '../../../services/api';
import dayjs from 'dayjs';
import { useAIStudio } from '../context/AIStudioContext';

const { Title, Text } = Typography;
const { Option } = Select;

const DeliverablesTab = () => {
  const { assets } = useAIStudio();
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clients, setClients] = useState([]);
  const [form] = Form.useForm();

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/deliverables');
      if (res.data.success) {
        setDeliverables(res.data.data.deliverables || res.data.data);
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/brands');
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchDeliverables();
    fetchClients();
  }, []);

  const handleCreate = async (values) => {
    try {
      const payload = {
        title: values.title,
        deliverableType: values.deliverableType,
        clientId: values.clientId,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        description: `AI Generated Asset Link: ${values.assetUrl}`
      };
      
      const res = await api.post('/deliverables', payload);
      if (res.data.success) {
        message.success('Deliverable created and sent to client');
        setIsModalVisible(false);
        form.resetFields();
        fetchDeliverables();
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to create deliverable');
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'deliverableType',
      key: 'type',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Approved') color = 'success';
        if (status === 'In Review' || status === 'Pending Approval') color = 'warning';
        return <Tag color={color}>{status || 'Pending'}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small">View</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4}>Deliverables</Title>
          <Text type="secondary">Send AI-generated work to clients for approval.</Text>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsModalVisible(true)}>
          New Deliverable
        </Button>
      </div>

      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12 }}>
        <Table scroll={{ x: 800 }}  
          columns={columns} 
          dataSource={deliverables} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Send AI Asset to Client"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Deliverable Title" rules={[{ required: true }]}>
            <Input placeholder="e.g., Q3 Instagram Ad Image" />
          </Form.Item>
          <Form.Item name="clientId" label="Client" rules={[{ required: true }]}>
            <Select placeholder="Select client">
              {clients.map(c => <Option key={c._id} value={c._id}>{c.brandName || c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="deliverableType" label="Asset Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="Social Media">Social Media</Option>
              <Option value="Ad Creative">Ad Creative</Option>
              <Option value="Video">Video</Option>
              <Option value="Web Design">Web Design</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assetUrl" label="Select AI Asset" rules={[{ required: true }]}>
            <Select placeholder="Choose an asset from your library">
              {assets.map(asset => (
                <Option key={asset._id} value={asset.url}>
                  {asset.type === 'video' ? '🎬' : '🖼️'} {asset.prompt.substring(0, 40)}...
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<Send size={16} />}>
                Create & Send
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliverablesTab;
