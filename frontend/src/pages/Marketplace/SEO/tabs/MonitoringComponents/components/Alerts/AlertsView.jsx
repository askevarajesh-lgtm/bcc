import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { seoWorkspaceApi } from '../../../../../../../api/seoWorkspaceApi';
import { Typography, Card, Button, Spin, Tag, Empty, Space, Alert as AntAlert, message } from 'antd';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { useMonitoring } from '../../MonitoringContext';

const { Title, Text } = Typography;

const AlertsView = ({ project }) => {
  const { projectId: routeProjectId } = useParams();
  const { activeProjectId: contextProjectId } = useMonitoring();
  const activeProjectId = routeProjectId || project?._id || contextProjectId;
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const res = await seoWorkspaceApi.getMonitoringAlerts(activeProjectId, 'Open');
        setAlerts(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [activeProjectId]);

  const handleResolve = async (alertId) => {
    try {
      await seoWorkspaceApi.updateMonitoringAlertStatus(activeProjectId, alertId, 'Resolved', 'Resolved via Dashboard');
      message.success('Alert resolved');
      setAlerts(alerts.filter(a => a._id !== alertId));
    } catch (err) {
      message.error('Failed to resolve alert');
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical': return <ShieldAlert size={24} color="#f5222d" />;
      case 'High': return <AlertTriangle size={24} color="#fa541c" />;
      case 'Medium': return <AlertTriangle size={24} color="#faad14" />;
      default: return <Info size={24} color="#1890ff" />;
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'gold';
      default: return 'processing';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin tip="Loading alerts..." size="large" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <Empty 
          image={<CheckCircle size={64} color="#52c41a" style={{ margin: '0 auto', opacity: 0.5 }} />}
          description={<span style={{ fontSize: 16, fontWeight: 500 }}>All Clear. No active monitoring alerts.</span>} 
        />
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Title level={4} style={{ marginBottom: 24 }}>Active Alerts</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {alerts.map(alert => (
          <Card key={alert._id} size="small" bodyStyle={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ marginTop: 2 }}>
                  {getSeverityIcon(alert.severity)}
                </div>
                <div>
                  <Space style={{ marginBottom: 4 }}>
                    <Tag color={getSeverityColor(alert.severity)}>{alert.severity}</Tag>
                    <Text type="secondary">{alert.category}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>• {new Date(alert.lastDetected).toLocaleString()}</Text>
                  </Space>
                  <Title level={5} style={{ margin: 0 }}>
                    {alert.entityType}: {alert.entityId}
                  </Title>
                  {alert.aiSummary && (
                    <AntAlert 
                      message={alert.aiSummary} 
                      type="info" 
                      showIcon={false} 
                      style={{ marginTop: 12, padding: '8px 12px' }} 
                    />
                  )}
                </div>
              </div>
              <Button 
                onClick={() => handleResolve(alert._id)}
                icon={<Check size={16} />}
              >
                Mark Resolved
              </Button>
            </div>
          </Card>
        ))}
      </Space>
    </motion.div>
  );
};

export default AlertsView;
