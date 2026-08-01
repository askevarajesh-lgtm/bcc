import React from 'react';
import { useMonitoring } from '../../MonitoringContext';
import { Typography, Card, Row, Col, Statistic, Spin, Tag } from 'antd';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const scoreColor = (score) => (score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#f5222d');

const Overview = () => {
  const { snapshot, loading, isScanning } = useMonitoring();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin tip="Loading overview metrics..." size="large" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">No monitoring data available.</Text>
      </div>
    );
  }

  const { healthScore, keywordSummary, alerts, uptime } = snapshot;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Monitoring Overview</Title>
          <Text type="secondary">Last updated: {new Date(snapshot.timestamp).toLocaleString()}</Text>
        </div>
        {isScanning && (
          <Tag color="processing" icon={<Activity size={14} style={{ marginRight: 4 }} />} style={{ padding: '4px 12px', fontSize: 14 }}>
            Scan in progress...
          </Tag>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic 
              title="Health Score" 
              value={healthScore} 
              suffix="/100" 
              valueStyle={{ color: scoreColor(healthScore), fontWeight: 'bold' }} 
              prefix={<Activity size={20} color={scoreColor(healthScore)} style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic 
              title="Active Alerts" 
              value={alerts?.totalOpen || 0} 
              valueStyle={{ fontWeight: 'bold' }} 
              prefix={<AlertTriangle size={20} color="#faad14" style={{ marginRight: 8 }} />}
            />
            {alerts?.critical > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text type="danger" strong>{alerts.critical} Critical</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic 
              title="Top 10 Keywords" 
              value={keywordSummary?.top10 || 0} 
              valueStyle={{ fontWeight: 'bold' }} 
              prefix={<CheckCircle size={20} color="#1890ff" style={{ marginRight: 8 }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Out of {keywordSummary?.total || 0} tracked</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic 
              title="Uptime" 
              value={uptime?.availability || '100'} 
              suffix="%" 
              valueStyle={{ fontWeight: 'bold' }} 
              prefix={<Clock size={20} color="#722ed1" style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Overview;
