import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Switch, Button, List, Tag, Modal, Form, Input, Select, message } from 'antd';
import { motion } from 'framer-motion';
import { Check, Plus, CreditCard, Settings, Trash2 } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Subscriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      setPlans(res.data.data);
    } catch (error) {
      message.error('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      const values = await form.validateFields();
      const newPlan = {
        name: values.name,
        price: values.price,
        interval: values.interval || '',
        description: values.description,
        features: values.features ? values.features.split('\n').filter(f => f.trim() !== '') : [],
        popular: values.popular || false,
        active: 0,
      };

      await api.post('/subscriptions', newPlan);
      message.success('Plan created successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchPlans();
    } catch (error) {
      if (error.response) {
        message.error('Failed to create plan: ' + (error.response.data.message || error.message));
      }
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      message.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      message.error('Failed to delete plan');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
            Subscriptions & Plans
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage pricing tiers and billing settings for your SaaS platform.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon={<Settings size={18} />} style={{ height: 44, borderRadius: 8, fontWeight: 600 }}>Billing Settings</Button>
          <Button 
            type="primary" 
            icon={<Plus size={18} />} 
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'var(--accent-primary)', height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Create Plan
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 12 }}>
        <Text style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly billing</Text>
        <Switch defaultChecked />
        <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Annual billing <Tag color="green" style={{ borderRadius: 12, marginLeft: 8 }}>Save 20%</Tag></Text>
      </div>

      <Row gutter={[24, 24]}>
        {plans.map((plan, index) => (
          <Col xs={24} lg={8} key={plan._id}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} style={{ height: '100%' }}>
              <Card 
                className={`glassmorphism ${plan.popular ? 'popular-plan' : ''}`}
                style={{ 
                  borderRadius: 16, 
                  border: plan.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', 
                  background: 'var(--bg-secondary)',
                  height: '100%',
                  position: 'relative'
                }}
                bodyStyle={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                    MOST POPULAR
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>{plan.name}</Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>{plan.description}</Text>
                  </div>
                  <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDeletePlan(plan._id)} style={{ padding: 4 }} />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>{plan.interval}</span>
                </div>

                <Button 
                  type={plan.popular ? 'primary' : 'default'}
                  block 
                  style={{ 
                    height: 44, 
                    borderRadius: 8, 
                    fontWeight: 700, 
                    marginBottom: 32,
                    background: plan.popular ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  Edit Plan
                </Button>

                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', display: 'block', marginBottom: 16 }}>
                    Features included:
                  </Text>
                  <List
                    split={false}
                    dataSource={plan.features}
                    renderItem={item => (
                      <List.Item style={{ padding: '8px 0', border: 'none', display: 'flex', justifyContent: 'flex-start' }}>
                        <Check size={18} style={{ color: '#10b981', marginRight: 12 }} />
                        <Text style={{ fontSize: 14, fontWeight: 500 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontWeight: 500 }}>Active Subscriptions</Text>
                  <Tag color="blue" style={{ borderRadius: 12, fontWeight: 700, fontSize: 14, padding: '2px 12px' }}>{plan.active}</Tag>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Create New Plan</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="glass-modal"
        centered
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label={<Text style={{ fontWeight: 600 }}>Plan Name</Text>} name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Premium Plan" style={{ borderRadius: 8 }} />
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Price</Text>} name="price" rules={[{ required: true }]}>
              <Input placeholder="e.g. $499" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label={<Text style={{ fontWeight: 600 }}>Billing Interval</Text>} name="interval" initialValue="/month">
              <Select style={{ borderRadius: 8 }}>
                <Option value="/month">Monthly</Option>
                <Option value="/year">Yearly</Option>
                <Option value="">None (One-time)</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item label={<Text style={{ fontWeight: 600 }}>Description</Text>} name="description" rules={[{ required: true }]}>
            <TextArea placeholder="Brief description of who this plan is for..." rows={2} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item label={<Text style={{ fontWeight: 600 }}>Features (One per line)</Text>} name="features" rules={[{ required: true }]}>
            <TextArea placeholder="Up to 10 Users&#10;Advanced Analytics&#10;Priority Support" rows={4} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="popular" valuePropName="checked" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <Switch />
              <Text style={{ fontWeight: 600 }}>Highlight as "Most Popular" plan</Text>
            </div>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600 }}>Cancel</Button>
            <Button type="primary" onClick={handleCreatePlan} style={{ background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }}>Publish Plan</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
