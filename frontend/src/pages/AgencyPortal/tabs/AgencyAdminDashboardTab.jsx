import React from 'react';
import { Typography, Row, Col, Card, Button, Table, Tag, Progress } from 'antd';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import SlabCard from '../../../components/SlabCard';

const { Title, Text } = Typography;

const AgencyAdminDashboardTab = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const stats = [
    { label: 'AGENCY MRR', value: '₹42.8L', sub: '+12% MoM', trend: 'up', color: 'var(--accent-primary)', icon: <DollarSign size={20}/> },
    { label: 'GROSS MARGIN', value: '42%', sub: '+2.1% MoM', trend: 'up', color: 'var(--accent-secondary)', icon: <TrendingUp size={20}/> },
    { label: 'ACTIVE CLIENTS', value: '12', sub: '92% retention', trend: 'up', color: 'var(--accent-primary)', icon: <Briefcase size={20}/> },
    { label: 'TEAM MEMBERS', value: '48', sub: '5 managers', trend: 'neutral', color: 'var(--accent-warning)', icon: <Users size={20}/> }
  ];

  const teamPerformance = [
    { key: '1', name: 'Rahul S.', role: 'Agency Manager', clients: 4, mrr: '₹14.2L', mos: 82, status: 'Excellent' },
    { key: '2', name: 'Priya N.', role: 'Agency Manager', clients: 5, mrr: '₹18.5L', mos: 78, status: 'Good' },
    { key: '3', name: 'Amit K.', role: 'Agency Manager', clients: 3, mrr: '₹10.1L', mos: 64, status: 'Needs Review' },
  ];

  const columns = [
    { title: 'Manager Name', dataIndex: 'name', key: 'name', render: (text) => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (text) => <Text type="secondary">{text}</Text> },
    { title: 'Managed Clients', dataIndex: 'clients', key: 'clients', align: 'center', render: (val) => <Tag style={{ borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{val} Clients</Tag> },
    { title: 'Portfolio MRR', dataIndex: 'mrr', key: 'mrr', render: (text) => <Text style={{ fontWeight: 600 }}>{text}</Text> },
    { title: 'Avg MOS', dataIndex: 'mos', key: 'mos', render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Progress percent={val} showInfo={false} size="small" strokeColor={val >= 80 ? 'var(--accent-primary)' : val >= 70 ? 'var(--accent-secondary)' : 'var(--accent-warning)'} style={{ width: 80 }} />
        <span style={{ fontWeight: 600 }}>{val}</span>
      </div>
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => {
      let color = status === 'Excellent' ? 'var(--accent-primary)' : status === 'Good' ? 'var(--accent-secondary)' : 'var(--accent-danger)';
      return <span style={{ color, fontWeight: 700 }}>{status}</span>;
    }}
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>AGENCY OWNER VIEW</Text>
        <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>Agency Administration</Title>
        <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>High-level overview of your agency's financial health and team performance.</Text>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          {stats.map((stat, idx) => (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <SlabCard bodyStyle={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)', color: stat.color }}>{stat.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${stat.color}15`, color: stat.color, padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                    {stat.trend === 'up' ? <ArrowUpRight size={14}/> : stat.trend === 'down' ? <ArrowDownRight size={14}/> : <Activity size={14}/>}
                    {stat.sub}
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, display: 'block', marginBottom: 4 }}>{stat.label}</Text>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
              </SlabCard>
            </Col>
          ))}
        </Row>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<span style={{ fontWeight: 800, fontSize: 18 }}>Team Performance & Allocations</span>}
          extra={<Button type="primary" style={{ background: 'var(--accent-secondary)', fontWeight: 700, borderRadius: 8 }}>Manage Team</Button>}
          className="glassmorphism"
          style={{ borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}
          headStyle={{ borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table columns={columns} dataSource={teamPerformance} pagination={false} className="custom-table" />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AgencyAdminDashboardTab;
