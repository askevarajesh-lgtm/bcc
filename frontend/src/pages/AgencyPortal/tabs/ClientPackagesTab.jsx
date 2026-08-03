import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Input, Switch, Tag, message, Descriptions, Checkbox, Row, Col, Select } from 'antd';
import { Plus, Edit, Trash2, Eye, Star, Briefcase, Check, Rocket, Zap } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const availableFeatures = [
  { id: 'crm', label: 'CRM & Leads' },
  { id: 'website', label: 'Website Builder' },
  { id: 'social', label: 'Social Media' },
  { id: 'ads', label: 'Performance Ads' },
  { id: 'analytics', label: 'Analytics & Attribution' },
  { id: 'chatgpt', label: 'Chatgpt' },
  { id: 'canva', label: 'Canva' },
  { id: 'benchmark', label: 'Benchmark' },
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
    billingInterval: 'Monthly',
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
        billingInterval: pkg.billingInterval || 'Monthly',
        features: pkg.features || []
      });
    } else {
      setEditingPkg(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        billingInterval: 'Monthly',
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

  return (
    <div style={{ paddingBottom: 40, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
        <Button 
          type="primary" 
          style={{ 
            height: 48,
            padding: '0 28px',
            background: 'var(--accent-primary)', 
            color: 'white',
            fontWeight: 600, 
            borderRadius: 24,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: 15
          }}
          onClick={() => handleOpenModal()}
        >
          Create New Package
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 32, flexWrap: 'wrap', width: '100%' }}>
        {loading && <div style={{ padding: 40, color: 'var(--text-primary)' }}>Loading packages...</div>}
        {!loading && packages.map((pkg, index) => {
          const isPro = index % 2 !== 0;
          const icon = isPro ? <Edit size={20} color="white" /> : <Rocket size={20} color="white" />;
          
          const featureLabels = pkg.features.map(fId => {
            const feat = availableFeatures.find(a => a.id === fId);
            return feat ? feat.label : fId;
          });

          return (
            <div key={pkg._id} style={{
              position: 'relative',
              background: 'var(--bg-secondary)',
              borderRadius: 24,
              padding: '32px 32px 40px',
              border: isPro ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              boxShadow: isPro ? '0 20px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 320,
              maxWidth: 360,
              flex: '1 1 320px',
            }}>
              {isPro && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: 120,
                    background: 'linear-gradient(90deg, #ffcba4 0%, #ff8993 30%, #b271d4 70%, #6f9bf1 100%)',
                    zIndex: 0,
                    opacity: 0.8
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 20, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to bottom, transparent 0%, var(--bg-secondary) 80px)',
                    zIndex: 0
                  }} />
                </>
              )}
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>{pkg.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button 
                      type="text" 
                      icon={<Edit size={18} />} 
                      onClick={() => {
                        if (pkg.isAssigned) {
                          message.error("This package has already been assigned and cannot be modified or deleted.");
                        } else {
                          handleOpenModal(pkg);
                        }
                      }} 
                      style={{ padding: 0, height: 'auto', marginTop: -4, color: 'var(--text-secondary)' }} 
                    />
                    <Button 
                      type="text" 
                      danger 
                      icon={<Trash2 size={18} />} 
                      onClick={() => {
                        if (pkg.isAssigned) {
                          message.error("This package has already been assigned and cannot be modified or deleted.");
                        } else {
                          handleDelete(pkg._id);
                        }
                      }} 
                      style={{ padding: 0, height: 'auto', marginTop: -4 }} 
                    />
                  </div>
                </div>

                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, background: 'var(--accent-primary)', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  marginBottom: 20,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                }}>
                  {icon}
                </div>

                <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, minHeight: 44, lineHeight: 1.5 }}>
                  {pkg.description || (isPro ? 'For professionals who write every day' : 'Perfect for getting started')}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                  <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                    {pkg.price ? pkg.price.replace('/mo', '').replace('/month', '') : '$0'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8, fontWeight: 500 }}>
                    / {pkg.billingInterval === 'Yearly' ? 'year' : pkg.billingInterval === 'One Time' ? 'lifetime' : 'month'}
                  </span>
                </div>

                <Button 
                  type="primary" 
                  style={{ 
                    width: '100%', 
                    height: 52, 
                    borderRadius: 12, 
                    background: 'var(--accent-primary)',
                    border: 'none',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 32
                  }}
                  onClick={() => {
                    if (pkg.isAssigned) {
                      message.error("This package has already been assigned and cannot be modified or deleted.");
                    } else {
                      handleOpenModal(pkg);
                    }
                  }}
                >
                  Edit Package
                </Button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {featureLabels.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ 
                        minWidth: 20, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-primary)', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 2 
                      }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{feat}</span>
                    </div>
                  ))}
                  {featureLabels.length === 0 && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No specific features</span>
                     </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Price <span style={{ color: 'red' }}>*</span></label>
              <Input
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., ₹5.0L"
                size="large"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Billing Interval <span style={{ color: 'red' }}>*</span></label>
              <Select
                value={formData.billingInterval}
                onChange={value => setFormData({ ...formData, billingInterval: value })}
                size="large"
                style={{ width: '100%' }}
                options={[
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Yearly', label: 'Yearly' },
                  { value: 'One Time', label: 'One Time' },
                ]}
              />
            </div>
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
