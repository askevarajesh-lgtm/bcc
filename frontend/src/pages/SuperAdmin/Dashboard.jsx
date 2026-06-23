import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, message } from 'antd';
import { motion } from 'framer-motion';
import { Building2, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Companies', value: '0', prefix: <Building2 size={20} />, trend: '0%', isPositive: true },
    { title: 'Active Users', value: '0', prefix: <Users size={20} />, trend: '0%', isPositive: true },
    { title: 'MRR', value: '$0', prefix: <CreditCard size={20} />, trend: '0%', isPositive: true },
    { title: 'Churn Rate', value: '0%', prefix: <TrendingUp size={20} />, trend: '0%', isPositive: true },
  ]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, agenciesRes] = await Promise.all([
        api.get('/superadmin/dashboard-stats'),
        api.get('/agencies')
      ]);

      const data = statsRes.data.data;
      setStats([
        { title: 'Total Companies', value: data.totalCompanies.toString(), prefix: <Building2 size={20} />, trend: '+12%', isPositive: true },
        { title: 'Active Users', value: data.activeUsers.toString(), prefix: <Users size={20} />, trend: '+5.4%', isPositive: true },
        { title: 'MRR', value: `$${data.mrr.toLocaleString()}`, prefix: <CreditCard size={20} />, trend: '+8.2%', isPositive: true },
        { title: 'Churn Rate', value: data.churnRate, prefix: <TrendingUp size={20} />, trend: '-0.4%', isPositive: true },
      ]);

      // Just take the first 5 for recent
      setRecentCompanies(agenciesRes.data.data.slice(0, 5).map(item => ({
        key: item._id,
        name: item.name || 'Unknown',
        plan: item.plan ? item.plan.charAt(0).toUpperCase() + item.plan.slice(1) : 'Pro',
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active',
        mrr: `$${item.mrr || 0}`,
        joined: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
      })));

    } catch (error) {
      message.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{text}</Text>,
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => (
        <Tag color={plan === 'Enterprise' ? 'purple' : plan === 'Pro' ? 'blue' : 'default'} style={{ borderRadius: 12, px: 8 }}>
          {plan}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'Trial') color = 'orange';
        if (status === 'Churned') color = 'red';
        return <Tag color={color} style={{ borderRadius: 12 }}>{status}</Tag>;
      },
    },
    {
      title: 'MRR',
      dataIndex: 'mrr',
      key: 'mrr',
      render: (text) => <Text style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{text}</Text>,
    },
    {
      title: 'Joined Date',
      dataIndex: 'joined',
      key: 'joined',
      render: (text) => <Text type="secondary">{text}</Text>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
          Platform Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Monitor global platform performance and metrics.
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="glassmorphism hover-lift"
                style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 12, color: 'var(--accent-primary)' }}>
                    {stat.prefix}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: stat.isPositive ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 13, background: stat.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 12 }}>
                    {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.trend}
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>{stat.title}</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card 
              title={<span style={{ fontWeight: 700, fontSize: 18 }}>Recent Companies</span>}
              className="glassmorphism"
              style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', height: '100%' }}
              headStyle={{ borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}
              bodyStyle={{ padding: 0 }}
            >
              <Table 
                columns={columns} 
                dataSource={recentCompanies} 
                loading={loading}
                pagination={false}
                className="custom-table"
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card 
              title={<span style={{ fontWeight: 700, fontSize: 18 }}>Platform Health</span>}
              className="glassmorphism"
              style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', height: '100%' }}
              headStyle={{ borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Server Uptime</Text>
                    <Text style={{ fontWeight: 600, color: '#10b981' }}>99.99%</Text>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '99.99%', background: '#10b981', borderRadius: 4 }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>API Response Time</Text>
                    <Text style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>124ms</Text>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '40%', background: 'var(--accent-primary)', borderRadius: 4 }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Storage Used</Text>
                    <Text style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>45TB / 100TB</Text>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '45%', background: '#f59e0b', borderRadius: 4 }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
