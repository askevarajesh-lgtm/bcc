import React from 'react';
import { Typography, Row, Col, Card, Button, List, Tag } from 'antd';
import { motion } from 'framer-motion';
import { CheckSquare, AlertTriangle, MessageCircle, BarChart2, Eye, CheckCircle2 } from 'lucide-react';
import BubbleCard from '../../../components/BubbleCard';
import ClientDeliverablesWidget from '../components/ClientDeliverablesWidget';

const { Title, Text } = Typography;

const BrandManagerDashboardTab = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const actionItems = [
    { title: 'Review June Ad Creatives', type: 'Approval', deadline: 'Today, 5:00 PM', urgency: 'High', color: 'var(--accent-danger)' },
    { title: 'Approve SEO Content Plan', type: 'Approval', deadline: 'Tomorrow', urgency: 'Medium', color: 'var(--accent-warning)' },
    { title: 'Weekly Performance Sync', type: 'Meeting', deadline: 'Thu, 11:00 AM', urgency: 'Low', color: 'var(--accent-primary)' },
  ];

  const recentActivity = [
    { text: 'Agency uploaded Monthly Report', time: '2 hours ago', icon: <BarChart2 size={16}/> },
    { text: 'Neha S. approved Social Calendar', time: '4 hours ago', icon: <CheckCircle2 size={16}/> },
    { text: 'New Lead generated from Meta Ads', time: '5 hours ago', icon: <MessageCircle size={16}/> },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>OPERATIONS HUB</Text>
        <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>Manager Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Track your pending approvals, active campaigns, and daily team tasks.</Text>
      </motion.div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <motion.div variants={itemVariants}>
            <BubbleCard style={{ marginBottom: 24 }} bodyStyle={{ padding: 32 }}>
              <Title level={4} style={{ margin: '0 0 24px 0', fontWeight: 800 }}>Action Required</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {actionItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, color: item.color }}><AlertTriangle size={18} /></div>
                      <div>
                        <Text style={{ fontWeight: 700, display: 'block', fontSize: 15, color: 'var(--text-primary)' }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Due: {item.deadline}</Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Tag style={{ borderRadius: 8, background: 'transparent', border: `1px solid ${item.color}50`, color: item.color, fontWeight: 700 }}>{item.type}</Tag>
                      <Button type="primary" size="small" style={{ background: item.color, fontWeight: 700, borderRadius: 6, border: 'none' }}>Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </BubbleCard>
          </motion.div>

          <ClientDeliverablesWidget />

          <motion.div variants={itemVariants}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 800 }}>ACTIVE CAMPAIGNS</Text>
                      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>4</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--accent-secondary)' }}><BarChart2 size={24}/></div>
                  </div>
                  <Button type="link" style={{ padding: 0, fontWeight: 600, color: 'var(--accent-secondary)' }}>View campaign details →</Button>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 800 }}>PENDING TASKS</Text>
                      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>12</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--accent-warning)' }}><CheckSquare size={24}/></div>
                  </div>
                  <Button type="link" style={{ padding: 0, fontWeight: 600, color: 'var(--accent-secondary)' }}>Go to Task Manager →</Button>
                </Card>
              </Col>
            </Row>
          </motion.div>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card 
              title={<span style={{ fontWeight: 800 }}>Recent Activity Feed</span>} 
              className="glassmorphism" 
              style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}
              headStyle={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentActivity}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{item.icon}</div>}
                      title={<Text style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{item.text}</Text>}
                      description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>}
                    />
                  </List.Item>
                )}
              />
              <Button block style={{ marginTop: 16, borderRadius: 8, fontWeight: 600, background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>View All Activity</Button>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default BrandManagerDashboardTab;
