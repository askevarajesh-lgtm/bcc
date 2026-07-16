import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Input, Switch, Tag, message, Descriptions } from 'antd';
import { Plus, Edit, Trash2, Eye, Star, Users, Briefcase } from 'lucide-react';
import api from '../../../services/api';

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

const DirectPackagesTab = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPkg, setViewingPkg] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    users: '',
    features: []
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/direct-packages');
      setPackages(res.data.data);
    } catch (error) {
      message.error('Failed to fetch direct packages');
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
        users: pkg.userCount || '', // API response comes with userCount
        features: pkg.features || []
      });
    } else {
      setEditingPkg(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        users: '',
        features: []
      });
    }
    setIsModalOpen(true);
  };

  const handleView = (pkg) => {
    setViewingPkg(pkg);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.users) {
      message.error("Package Name, Price, and Users are required fields");
      return;
    }

    // Adapt to our backend model
    const payload = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      userCount: Number(formData.users),
      features: formData.features
    };

    try {
      if (editingPkg) {
        await api.put(`/direct-packages/${editingPkg._id}`, payload);
        message.success("Package updated successfully");
      } else {
        await api.post('/direct-packages', payload);
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
      await api.delete(`/direct-packages/${id}`);
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
          <Button type="text" icon={<Eye size={16} />} onClick={() => handleView(record)} />
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleOpenModal(record)} />
          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(record._id)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Direct Brand Packages</Title>
          <Text type="secondary">Define feature tiers and pricing for your direct brand accounts.</Text>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Users - Count <span style={{color: '#ef4444'}}>*</span></Text>
              <Input 
                placeholder="e.g., 5" 
                value={formData.users} 
                onChange={(e) => setFormData({...formData, users: e.target.value})} 
                style={{ borderRadius: 8, padding: '8px 12px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Included Features</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      <Modal
        title={null}
        footer={null}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        width={650}
        bodyStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden' }}
        style={{ top: 20 }}
        closeIcon={<span style={{ color: '#fff', fontSize: 20 }}>×</span>}
      >
        {viewingPkg && (
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', 
              padding: '32px 24px',
              color: '#fff',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: 16, 
                  background: 'rgba(255,255,255,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <Star size={32} color="#fff" />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>{viewingPkg.name}</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{viewingPkg.description || 'No description provided'}</Text>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 
              }}>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>PRICE</Text>
                  <Text style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingPkg.price || 'Custom'}</Text>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Users size={14} color="var(--text-secondary)" />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>USERS</Text>
                  </div>
                  <Text style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 600 }}>{viewingPkg?.userCount || viewingPkg?.users || '-'}</span>
                  </Text>
                </div>
              </div>

              <div>
                <Title level={5} style={{ marginBottom: 16, fontWeight: 700 }}>Included Features</Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {availableFeatures.map(feat => {
                    const isIncluded = viewingPkg.features?.includes(feat.id);
                    return (
                      <div 
                        key={feat.id} 
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          background: isIncluded ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-tertiary)', 
                          padding: '12px 16px', 
                          borderRadius: 8,
                          border: isIncluded ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                          opacity: isIncluded ? 1 : 0.6
                        }}
                      >
                        <span style={{ 
                          fontSize: 13, 
                          fontWeight: 600, 
                          color: isIncluded ? 'var(--text-primary)' : 'var(--text-secondary)' 
                        }}>
                          {feat.label}
                        </span>
                        {isIncluded ? (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                        ) : (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-color)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <Button onClick={() => setIsViewModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600 }}>
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DirectPackagesTab;
