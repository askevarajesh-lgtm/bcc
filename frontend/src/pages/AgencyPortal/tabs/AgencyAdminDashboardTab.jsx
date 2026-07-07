import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Table, Tag, Progress, Spin } from 'antd';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import SlabCard from '../../../components/SlabCard';

const { Title, Text } = Typography;

const AgencyAdminDashboardTab = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    agencyMrr: '₹0L',
    grossMargin: 'N/A',
    activeClients: 0,
    teamMembers: 0,
    teamPerformance: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/agencies/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const stats = [
    { label: 'AGENCY MRR', value: dashboardData.agencyMrr, sub: 'Current', trend: 'up', color: 'var(--accent-primary)', icon: <DollarSign size={20}/> },
    { label: 'GROSS MARGIN', value: dashboardData.grossMargin, sub: 'Current', trend: 'up', color: 'var(--accent-secondary)', icon: <TrendingUp size={20}/> },
    { label: 'ACTIVE CLIENTS', value: dashboardData.activeClients.toString(), sub: 'Managed', trend: 'up', color: 'var(--accent-primary)', icon: <Briefcase size={20}/> },
    { label: 'TEAM MEMBERS', value: dashboardData.teamMembers.toString(), sub: 'Total', trend: 'neutral', color: 'var(--accent-warning)', icon: <Users size={20}/> }
  ];

  const teamPerformance = dashboardData.teamPerformance;

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

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
