import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Spin, message } from 'antd';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';

const { Title, Text } = Typography;

const AnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getDashboardStats();
      if (res.success) setStats(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>HR Analytics Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>In-depth insights into your workforce.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: 300 }}>
            <Title level={5} style={{ marginTop: 0 }}>Workforce Distribution</Title>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: '16px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>{stats?.totalEmployees || 0}</Title>
              </div>
              <Text type="secondary" style={{ marginTop: 12 }}>Total Active Employees</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: 300 }}>
            <Title level={5} style={{ marginTop: 0 }}>Monthly Payroll Expense</Title>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column' }}>
              <Title level={1} style={{ margin: 0, color: 'var(--accent-warning)', fontSize: 48 }}>₹{stats?.totalPayroll?.toLocaleString() || 0}</Title>
              <Text type="secondary" style={{ marginTop: 12 }}>Total Disbursed This Month</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Leave Trends</Title>
            <Title level={2} style={{ color: 'var(--accent-success)' }}>{stats?.leavesToday || 0}</Title>
            <Text type="secondary">Employees on leave today</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Recruitment Pipeline</Title>
            <Title level={2} style={{ color: 'var(--accent-primary)' }}>{stats?.openPositions || 0}</Title>
            <Text type="secondary">Open job positions</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Company Performance</Title>
            <Title level={2} style={{ color: 'var(--accent-warning)' }}>{stats?.avgPerformance || 0}/5</Title>
            <Text type="secondary">Average KPI Rating</Text>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default AnalyticsTab;
