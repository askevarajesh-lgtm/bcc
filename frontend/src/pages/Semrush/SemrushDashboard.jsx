import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, Button, Row, Col, Modal, Form, Input, Checkbox, message, Table, Select, Popconfirm, Space } from 'antd';
import { motion } from 'framer-motion';
import { Search, FolderPlus, MessageSquare, HeartPulse, Eye, MousePointer2, Link, Plus, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { semrushApi } from '../../api/semrushApi';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClientsQuery } from '../../api/clientApi';
import api from '../../services/api';

const { Title, Text } = Typography;

const SemrushDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [adminClients, setAdminClients] = useState([]);
  const { data: clientsData } = useGetClientsQuery({});

  useEffect(() => {
    const fetchAdminClients = async () => {
      if (['commander_admin', 'supreme_super_admin'].includes(user?.role)) {
        try {
          const [agenciesRes, brandsRes] = await Promise.all([
            api.get('/agencies'),
            api.get('/brands') // returns direct brands for admin
          ]);
          const agencies = (agenciesRes.data.data || []).map(a => ({ ...a, clientType: 'Agency' }));
          const brands = (brandsRes.data.data || []).map(b => ({ ...b, clientType: 'Direct Brand' }));
          setAdminClients([...agencies, ...brands]);
        } catch (error) {
          console.error("Failed to fetch admin clients", error);
        }
      }
    };
    fetchAdminClients();
  }, [user]);

  const clients = ['commander_admin', 'supreme_super_admin'].includes(user?.role) ? adminClients : (clientsData?.data || []);

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

  const handleCreateOrUpdateProject = async (values) => {
    try {
      setLoading(true);
      const payload = {
        domain: values.domain,
        name: values.name
      };
      if (values.clientId) {
        payload.clientId = values.clientId;
      }
      
      let res;
      if (editingProject) {
        res = await semrushApi.updateProject(editingProject._id, payload);
      } else {
        res = await semrushApi.createProject(payload);
      }

      if (res.data.success) {
        message.success(`Project ${editingProject ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        setEditingProject(null);
        form.resetFields();
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || `Failed to ${editingProject ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      setLoading(true);
      const res = await semrushApi.deleteProject(id);
      if (res.data.success) {
        message.success('Project deleted successfully');
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      domain: project.domain,
      clientId: project.clientId
    });
    setIsModalVisible(true);
  };

  const renderMetric = (metricObject, isPercent = false) => {
    if (!metricObject) return <Text strong type="secondary">Unavailable</Text>;
    
    // If it's just a raw number (from legacy `stats` flat object)
    if (typeof metricObject === 'number' || typeof metricObject === 'string') {
      const val = Number(metricObject);
      if (isNaN(val)) return <Text strong type="secondary">Unavailable</Text>;
      return <Text strong style={{ color: 'var(--accent-primary)' }}>{val}{isPercent ? '%' : ''}</Text>;
    }

    // New Canonical Dataset Structure handling
    if (metricObject.status === 'not_configured') return <Text type="secondary">Not configured</Text>;
    if (metricObject.status === 'unavailable') return <Text type="secondary">Unavailable</Text>;
    if (metricObject.status === 'failed') return <Text type="danger">Failed</Text>;
    if (metricObject.status === 'rate_limited') return <Text type="secondary">Temporarily unavailable</Text>;
    
    if (metricObject.value === null || metricObject.value === undefined) return <Text type="secondary">Unavailable</Text>;

    let text = `${metricObject.value}${isPercent ? '%' : ''}`;
    if (metricObject.status === 'stale') {
      return <Text strong style={{ color: 'var(--accent-primary)' }}>{text} <span style={{ fontSize: 10, color: '#8c8c8c' }}>(Stale)</span></Text>;
    }
    
    return <Text strong style={{ color: 'var(--accent-primary)' }}>{text}</Text>;
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
      render: (val) => renderMetric(val)
    },
    {
      title: 'GEO Score',
      dataIndex: ['optimizationScore', 'geoScore'],
      key: 'geoScore',
      render: (val) => renderMetric(val)
    },
    {
      title: 'AEO Score',
      dataIndex: ['optimizationScore', 'aeoScore'],
      key: 'aeoScore',
      render: (val) => renderMetric(val)
    },
    {
      title: 'Site Health',
      dataIndex: ['stats', 'siteHealth'],
      key: 'siteHealth',
      render: (val) => renderMetric(val, true)
    },
    {
      title: 'Visibility',
      dataIndex: ['stats', 'visibility'],
      key: 'visibility',
      render: (val) => renderMetric(val, true)
    },
    {
      title: 'Organic Traffic',
      dataIndex: ['stats', 'organicTraffic'],
      key: 'organicTraffic',
      render: (val) => renderMetric(val)
    },
    {
      title: 'Organic Keywords',
      dataIndex: ['stats', 'organicKeywords'],
      key: 'organicKeywords',
      render: (val) => renderMetric(val)
    },
    {
      title: 'Backlinks',
      dataIndex: ['stats', 'backlinks'],
      key: 'backlinks',
      render: (val) => renderMetric(val)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Delete the project"
            description="Are you sure to delete this project?"
            onConfirm={() => handleDeleteProject(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      )
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
          <Button type="primary" icon={<FolderPlus size={16} />} onClick={() => { setEditingProject(null); form.resetFields(); setIsModalVisible(true); }} size="large" style={{ borderRadius: '8px' }}>
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
            <span style={{ fontSize: '18px', fontWeight: 600 }}>{editingProject ? 'Edit folder' : 'Create folder'}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); setEditingProject(null); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdateProject} style={{ marginTop: '24px' }}>
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

          {['commander_admin', 'supreme_super_admin'].includes(user?.role) && (
            <Form.Item
              label={<Text strong>Client / Direct Brand</Text>}
              name="clientId"
              rules={[{ required: true, message: 'Please select a client or direct brand' }]}
            >
              <Select placeholder="Select a client or brand" size="large">
                {clients.map(c => (
                  <Select.Option key={c._id} value={c._id}>
                    {c.clientType ? `${c.clientType}: ${c.name || c.companyName}` : `${c.name || c.companyName}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="share" valuePropName="checked">
            <Checkbox>Share once created</Checkbox>
          </Form.Item>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" size="large" style={{ background: '#18181b', borderRadius: '6px' }}>
              {editingProject ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => { setIsModalVisible(false); setEditingProject(null); }} size="large" style={{ borderRadius: '6px' }}>
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default SemrushDashboard;
