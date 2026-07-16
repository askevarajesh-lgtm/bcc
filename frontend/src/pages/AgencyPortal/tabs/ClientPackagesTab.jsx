import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Input, Switch, Tag, message, Descriptions, Checkbox, Row, Col } from 'antd';
import { Plus, Edit, Trash2, Eye, Star, Briefcase } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const availableFeatures = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'aistudio', label: 'Ai Studio' },
  { id: 'social', label: 'Social Media' },
  { id: 'ads', label: 'Performance Ads' },
  { id: 'crm', label: 'CRM & Leads' },
  { id: 'website', label: 'Websites' },
  { id: 'analytics', label: 'Analytics & Attribution' },
  { id: 'chatgpt', label: 'Chatgpt' },
  { id: 'canva', label: 'Canva' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'seo', label: 'Seo Intelligence' },
  { id: 'marketplace', label: 'Masketplace' }
];

const ClientPackagesTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: []
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agency/client-packages');
      setPackages(res.data.data);
    } catch (error) {
      message.error('Failed to fetch client packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price || '',
        features: pkg.features || []
      });
    } else {
      setEditingPkg(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        features: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      message.error("Package Name and Price are required fields");
      return;
    }

    try {
      if (editingPkg) {
        await api.put(`/agency/client-packages/${editingPkg._id}`, formData);
        message.success("Package updated successfully");
      } else {
        await api.post('/agency/client-packages', formData);
        message.success("Package created successfully");
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (error) {
      message.error("Failed to save package");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/agency/client-packages/${id}`);
      message.success("Package deleted successfully");
      fetchPackages();
    } catch (error) {
      message.error("Failed to delete package");
    }
  };

  const toggleFeature = (featureId, checked) => {
    setFormData(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, featureId]
        : prev.features.filter(f => f !== featureId)
    }));
  };

  const columns = [
    {
      title: 'Package Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (text) => <Text type="secondary" style={{ fontWeight: 600 }}>{text || 'Custom'}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Included Features',
      key: 'features',
      render: (_, record) => {
        const featureLabels = record.features.map(fId => {
          const feat = availableFeatures.find(a => a.id === fId);
          return feat ? feat.label : fId;
        });

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {featureLabels.slice(0, 3).map(feat => (
              <Tag key={feat} color="blue">{feat}</Tag>
            ))}
            {featureLabels.length > 3 && <Tag>+{featureLabels.length - 3}</Tag>}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleOpenModal(record)} />
          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(record._id)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Client Packages</Title>
          <Text type="secondary">Define feature tiers and pricing for your clients.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          style={{ background: 'var(--accent-primary)', fontWeight: 700, borderRadius: 8 }}
          onClick={() => handleOpenModal()}
        >
          Create Package
        </Button>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={packages} 
          rowKey="_id" 
          pagination={false}
          loading={loading}
        />
      </div>

      <Modal
        title={editingPkg ? "Edit Package" : "Create New Package"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Save Package"
        okButtonProps={{ style: { background: 'var(--accent-primary)' } }}
        width={700}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, paddingRight: 8 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Package Name <span style={{color: 'red'}}>*</span></label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g., VIP Tier" 
              size="large"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <Input.TextArea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Brief description of this tier" 
              rows={2}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Price <span style={{color: 'red'}}>*</span></label>
            <Input 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              placeholder="e.g., ₹5.0L/mo" 
              size="large"
            />
          </div>
          
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Included Features</label>
            <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                {availableFeatures.filter(feat => (user?.features || []).includes(feat.id)).map(feat => (
                  <div key={feat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{feat.label}</span>
                    <Switch 
                      checked={formData.features.includes(feat.id)} 
                      onChange={(checked) => toggleFeature(feat.id, checked)}
                    />
                  </div>
                ))}
                {availableFeatures.filter(feat => (user?.features || []).includes(feat.id)).length === 0 && (
                  <Text type="secondary" style={{ fontStyle: 'italic', gridColumn: 'span 2' }}>
                    Your agency package does not currently have any active features. Please upgrade your agency package to offer features to clients.
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ClientPackagesTab;
