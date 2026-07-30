import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Empty, Skeleton, Alert, Progress } from 'antd';
import { LayoutGrid, Globe, ClipboardList, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';

const { Title, Text } = Typography;

const PHASE_LABELS = {
  intake: 'Intake', audit: 'Audit', strategy: 'Strategy', implementation: 'Implementation',
  reaudit: 'Re-audit', report: 'Report', monitoring: 'Monitoring', complete: 'Complete'
};

const DashboardTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await seoWorkspaceApi.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <LayoutGrid size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">High-level overview of every SEO project, pending approvals, and recent activity.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data || data.totalProjects === 0 ? (
        <Empty description="No SEO Workspace projects yet — create one from the Audit tab to get started." />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} md={6}>
              <Card size="small"><Statistic title="Projects" value={data.totalProjects} prefix={<Globe size={16} />} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small"><Statistic title="Pending Strategies" value={data.pendingStrategies} prefix={<ClipboardList size={16} />} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small"><Statistic title="Pending Tasks" value={data.pendingTasks} prefix={<ClipboardList size={16} />} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Failed Tasks"
                  value={data.failedTasks}
                  prefix={<AlertTriangle size={16} />}
                  valueStyle={data.failedTasks > 0 ? { color: '#f5222d' } : undefined}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" title="Projects" style={{ height: '100%' }}>
                <Table
                  rowKey="_id"
                  size="small"
                  pagination={false}
                  dataSource={data.projects}
                  locale={{ emptyText: <Empty description="No projects yet" /> }}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
                    { title: 'Phase', dataIndex: 'phase', key: 'phase', render: (p) => <Tag>{PHASE_LABELS[p] || p}</Tag> },
                    {
                      title: 'Last Audit Score', key: 'lastAuditScore',
                      render: (_, r) => r.stats?.lastAuditScore != null
                        ? <Progress percent={Math.round(r.stats.lastAuditScore)} size="small" style={{ width: 100 }} />
                        : <Text type="secondary">—</Text>
                    }
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title={<span><Activity size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Recent Activity</span>} style={{ height: '100%' }}>
                {(!data.recentActivity || data.recentActivity.length === 0) ? (
                  <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    rowKey="_id"
                    size="small"
                    pagination={false}
                    showHeader={false}
                    dataSource={data.recentActivity}
                    columns={[
                      {
                        key: 'entry',
                        render: (_, r) => (
                          <div>
                            <Text strong>{r.action?.replace(/_/g, ' ')}</Text>{' '}
                            <Text type="secondary">on {r.targetType}</Text>
                            <div><Text type="secondary" style={{ fontSize: 12 }}>
                              {r.userId?.name || 'Unknown user'} · {new Date(r.createdAt).toLocaleString()}
                            </Text></div>
                          </div>
                        )
                      }
                    ]}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
};

export default DashboardTab;