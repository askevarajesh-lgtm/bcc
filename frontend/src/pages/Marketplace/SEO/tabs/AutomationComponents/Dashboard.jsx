import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';

export default function Dashboard({ projectId }) {
  const [metrics, setMetrics] = useState({ queuedTasks: 0, completed: 0, failed: 0, activeGlobal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchMetrics = async () => {
    if (!projectId) return;
    try {
      const res = await seoWorkspaceApi.getAutomationMetrics(projectId);
      setMetrics(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 8px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} className="glass-card">
            <Statistic title="Active Workers" value={metrics.activeGlobal} prefix={<Activity size={16} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="glass-card">
            <Statistic title="Queued Tasks" value={metrics.queuedTasks} prefix={<Clock size={16} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="glass-card">
            <Statistic title="Completed Runs" value={metrics.completed} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircle size={16} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="glass-card">
            <Statistic title="Failed Runs" value={metrics.failed} valueStyle={{ color: '#cf1322' }} prefix={<XCircle size={16} />} />
          </Card>
        </Col>
      </Row>
      
      <Card title="Recent Activity" bordered={false} className="glass-card">
        <Table 
          loading={loading}
          dataSource={[]} 
          columns={[
            { title: 'Workflow', dataIndex: 'workflowName', key: 'workflowName' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Succeeded' ? 'green' : 'red'}>{s}</Tag> },
            { title: 'Duration', dataIndex: 'duration', key: 'duration' },
            { title: 'Time', dataIndex: 'time', key: 'time' }
          ]} 
          pagination={false} 
        />
      </Card>
    </div>
  );
}
