import React from 'react';
import { Typography, Card, Row, Col, Avatar, Tag, Divider, Tabs } from 'antd';
import { motion } from 'framer-motion';
import { Building2, User, Shield, Star, Briefcase, Link } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ClientIntegrationsTab from './ClientIntegrationsTab';

const { Title, Text } = Typography;

const ProfileContent = ({ user }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={20} color="var(--accent-primary)" /> My Profile
          </Title>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
            <Avatar size={80} style={{ backgroundColor: 'var(--accent-primary)', fontSize: 32, fontWeight: 800 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{user?.name || 'Client User'}</Title>
              <Text type="secondary" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{user?.email}</Text>
              <Tag color="blue" style={{ borderRadius: 12, border: 'none', fontWeight: 700, padding: '2px 12px' }}>
                View Only Access
              </Tag>
            </div>
          </div>

          <Divider />

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>Full Name</Text>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name || '-'}
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>Email Address</Text>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.email || '-'}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card bordered={false} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <Title level={4} style={{ marginBottom: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} color="var(--accent-secondary)" /> Company Information
          </Title>
          
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>Company Name</Text>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.companyName || 'Prestige Estates'}
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>Account Status</Text>
                <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                  <Tag color="success" style={{ borderRadius: 12, border: 'none', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-secondary)', fontWeight: 700, margin: 0 }}>
                    <Star size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: '-1px' }} /> Active
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Text style={{ color: 'var(--accent-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} /> Contact your dedicated Agency Manager to update company details, manage billing, or adjust permissions.
            </Text>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

const ClientSettingsTab = () => {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const tabItems = [
    {
      key: '1',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><User size={16} /> Profile</span>,
      children: <ProfileContent user={user} />,
    },
    {
      key: '2',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Link size={16} /> Integrations</span>,
      children: <ClientIntegrationsTab />,
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Account Settings</Title>
        <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
          View your profile, company details, and connected integrations.
        </Text>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs items={tabItems} style={{ marginBottom: 32 }} />
      </motion.div>
    </motion.div>
  );
};

export default ClientSettingsTab;
