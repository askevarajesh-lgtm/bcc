import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress } from 'antd';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';

export default function QueueMonitor({ projectId }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchMetrics = async () => {
    try {
      const res = await seoWorkspaceApi.getAutomationQueue(projectId);
      setMetrics(res.data);
    } catch (error) {}
  };

  if (!metrics) return <div>Loading queue metrics...</div>;

  const total = metrics.completed + metrics.failed;
  const successRate = total > 0 ? (metrics.completed / total) * 100 : 100;

  return (
    <div style={{ padding: '0 8px' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card className="glass-card">
            <Statistic title="Queued Tasks" value={metrics.queuedTasks} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card">
            <Statistic title="Dead Letter Queue" value={metrics.deadLetterCount} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Success Rate</div>
              <Progress type="dashboard" percent={successRate.toFixed(1)} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card">
            <Statistic title="Total Exec Time (ms)" value={metrics.totalExecTime} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card">
            <Statistic title="Total Wait Time (ms)" value={metrics.totalWaitTime} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card">
            <Statistic title="Queue Status" value={metrics.isPaused ? 'PAUSED' : 'RUNNING'} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
