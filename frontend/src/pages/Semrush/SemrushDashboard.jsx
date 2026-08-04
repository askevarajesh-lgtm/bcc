import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, Button, Row, Col, Modal, Form, Input, Checkbox, message, Table } from 'antd';
import { motion } from 'framer-motion';
import { Search, FolderPlus, MessageSquare, HeartPulse, Eye, MousePointer2, Link, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { semrushApi } from '../../api/semrushApi';

const { Title, Text } = Typography;

const SemrushDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await semrushApi.getProjects();
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values) => {
    try {
      setLoading(true);
      const res = await semrushApi.createProject({
        domain: values.domain,
        name: values.name
      });
      if (res.data.success) {
        message.success('Project created successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => navigate(`/intelligence/semrush/${record._id}`)}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.domain}</Text>
        </div>
      )
    },
    {
      title: 'SEO Score',
      dataIndex: ['optimizationScore', 'seoScore'],
      key: 'seoScore',
      render: (val) => <Text strong style={{ color: 'var(--accent-secondary)' }}>{val || 0}</Text>
    },
    {
      title: 'GEO Score',
      dataIndex: ['optimizationScore', 'geoScore'],
      key: 'geoScore',
      render: (val) => <Text strong style={{ color: 'var(--accent-warning)' }}>{val || 0}</Text>
    },
    {
      title: 'AEO Score',
      dataIndex: ['optimizationScore', 'aeoScore'],
      key: 'aeoScore',
      render: (val) => <Text strong style={{ color: 'var(--accent-info)' }}>{val || 0}</Text>
    },
    {
      title: 'Site Health',
      dataIndex: ['stats', 'siteHealth'],
      key: 'siteHealth',
      render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val || 0}%</Text>
    },
    {
      title: 'Visibility',
      dataIndex: ['stats', 'visibility'],
      key: 'visibility',
      render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val || 0}%</Text>
    },
    {
      title: 'Organic Traffic',
      dataIndex: ['stats', 'organicTraffic'],
      key: 'organicTraffic',
      render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val || 0}</Text>
    },
    {
      title: 'Organic Keywords',
      dataIndex: ['stats', 'organicKeywords'],
      key: 'organicKeywords',
      render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val || 0}</Text>
    },
    {
      title: 'Backlinks',
      dataIndex: ['stats', 'backlinks'],
      key: 'backlinks',
      render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val || 0}</Text>
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
            <Search size={32} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>SEO/AEO/GEO Projects</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>Manage your domains and folders</Text>
          </div>
        </div>
        <div>
          <Button type="primary" icon={<FolderPlus size={16} />} onClick={() => setIsModalVisible(true)} size="large" style={{ borderRadius: '8px' }}>
            Create Folder
          </Button>
        </div>
      </div>

      <Card title="Folders" style={{ borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
        ) : (
          <Table 
            dataSource={projects}
            columns={columns}
            rowKey="_id"
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/intelligence/semrush/${record._id}`),
              style: { cursor: 'pointer' }
            })}
          />
        )}
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={20} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Create folder</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject} style={{ marginTop: '24px' }}>
          <Form.Item
            label={<Text strong>Website</Text>}
            name="domain"
            rules={[{ required: true, message: 'Please enter a domain' }]}
            extra="Don't have a website? Add a competitor"
          >
            <Input placeholder="Enter a domain or subdomain" size="large" />
          </Form.Item>

          <Form.Item
            label={<Text strong>Name</Text>}
            name="name"
            rules={[{ required: true, message: 'Please enter a business name' }]}
          >
            <Input placeholder="Enter a business name" size="large" />
          </Form.Item>

          <Form.Item name="share" valuePropName="checked">
            <Checkbox>Share once created</Checkbox>
          </Form.Item>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" size="large" style={{ background: '#18181b', borderRadius: '6px' }}>
              Create
            </Button>
            <Button onClick={() => setIsModalVisible(false)} size="large" style={{ borderRadius: '6px' }}>
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default SemrushDashboard;
