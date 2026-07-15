import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, Tag, Empty, Button, List } from 'antd';
import { Activity, Plus, Globe, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ScoreCard from './components/ScoreCard';
import useWorkspaceDashboard from './hooks/useWorkspaceDashboard';

const { Title, Text } = Typography;

// New "Overview" tab: pure aggregation over existing collections (Step 2 of
// the plan) — counts of projects by phase, pending approvals, recent
// activity. No new source-of-truth data, just a rollup of what already exists.
const DashboardPanel = ({ isViewOnly, onCreateProject }) => {
  const { dashboard, loading, fetchDashboard } = useWorkspaceDashboard();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading && !dashboard) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!dashboard || dashboard.totalProjects === 0) {
    return (
      <Card className="seo-glass-panel seo-empty-state">
        <Activity className="seo-empty-icon" />
        <Title level={3} style={{ marginBottom: 8 }}>Welcome to the SEO Agent Team Workspace</Title>
        <Text className="seo-empty-text" style={{ display: 'block', marginBottom: 24 }}>
          Connect a project to start auditing and building AI SEO strategies.
        </Text>
        {!isViewOnly && (
          <Button type="primary" size="large" icon={<Plus size={18} />} className="seo-glow-btn" onClick={onCreateProject}>
            Create New SEO Project
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <ScoreCard title="Total Projects" value={dashboard.totalProjects} icon={<Globe size={16} />} />
        </Col>
        <Col xs={12} md={6}>
          <ScoreCard title="Pending Strategy Approvals" value={dashboard.pendingStrategies} icon={<Clock size={16} />} />
        </Col>
        <Col xs={12} md={6}>
          <ScoreCard title="Pending Tasks" value={dashboard.pendingTasks} icon={<CheckCircle2 size={16} />} />
        </Col>
        <Col xs={12} md={6}>
          <ScoreCard title="Failed Tasks" value={dashboard.failedTasks} icon={<AlertTriangle size={16} />} />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            className="seo-glass-panel"
            title="Your Projects"
            extra={!isViewOnly && (
              <Button type="primary" size="small" icon={<Plus size={14} />} className="seo-glow-btn" onClick={onCreateProject}>
                New Project
              </Button>
            )}
          >
            {dashboard.projects.length === 0 ? (
              <Empty description="No projects yet" />
            ) : (
              <List
                dataSource={dashboard.projects}
                renderItem={(p) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{p.name}</Text>}
                      description={<a href={`https://${p.domain}`} target="_blank" rel="noreferrer">{p.domain}</a>}
                    />
                    <Tag color="blue">{(p.phase || 'intake').toUpperCase()}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="seo-glass-panel" title="Recent Activity">
            {dashboard.recentActivity.length === 0 ? (
              <Empty description="No recent activity" />
            ) : (
              <List
                dataSource={dashboard.recentActivity}
                renderItem={(a) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text>{a.action.replace(/_/g, ' ')} · {a.targetType}</Text>}
                      description={<Text type="secondary" style={{ fontSize: 12 }}>
                        {a.userId?.name || 'System'} · {new Date(a.createdAt).toLocaleString()}
                      </Text>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPanel;
