import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Input, Switch, Tag, message } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../../services/api';

const { Title, Text } = Typography;

const availableFeatures = [
  { id: 'dashboard', label: 'Platform Overview' },
  { id: 'clients', label: 'Clients & Accounts' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'seo', label: 'SEO' },
  { id: 'content', label: 'Content' },
  { id: 'aistudio', label: 'AI Studio' },
  { id: 'social', label: 'Social Media' },
  { id: 'ads', label: 'Performance Ads' },
  { id: 'crm', label: 'CRM' },
  { id: 'automation', label: 'Automation' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'website', label: 'Website Builder' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'mos', label: 'MOS Score' },
  { id: 'copilot', label: 'AI Copilot' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'canva', label: 'Canva' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'team', label: 'Team' },
  { id: 'time', label: 'Time Tracking' },
  { id: 'resources', label: 'Resources' },
  { id: 'finance', label: 'Finance' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'newbusiness', label: 'New Business' },
  { id: 'businessintel', label: 'Business Intel' },
  { id: 'settings', label: 'Settings' }
];

const AgencyPackagesTab = () => {
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
      const res = await api.get('/agency-packages');
      setPackages(res.data.data);
    } catch (error) {
      message.error('Failed to fetch agency packages');
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
    if (!formData.name) {
      message.error("Package name is required");
      return;
    }

    try {
      if (editingPkg) {
        await api.put(`/agency-packages/${editingPkg._id}`, formData);
        message.success("Package updated successfully");
      } else {
        await api.post('/agency-packages', formData);
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
      await api.delete(`/agency-packages/${id}`);
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
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Agency Packages</Title>
          <Text type="secondary">Define feature tiers and pricing for your agency accounts.</Text>
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
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Package Name</label>
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
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Price (Optional)</label>
            <Input 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              placeholder="e.g., ₹5.0L/mo" 
              size="large"
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Included Features</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
              {availableFeatures.map(feat => (
                <div key={feat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '10px 16px', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{feat.label}</span>
                  <Switch 
                    size="small" 
                    checked={formData.features.includes(feat.id)} 
                    onChange={(checked) => toggleFeature(feat.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgencyPackagesTab;
