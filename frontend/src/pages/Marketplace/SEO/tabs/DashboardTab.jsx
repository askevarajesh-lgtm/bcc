import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Empty, Skeleton, Alert, Progress, Space, Divider } from 'antd';
import { LayoutGrid, Globe, ClipboardList, AlertTriangle, Activity, TrendingUp, ActivitySquare, ServerCrash, CheckCircle, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

const PHASE_LABELS = {
  intake: 'Intake', audit: 'Audit', strategy: 'Strategy', implementation: 'Implementation',
  reaudit: 'Re-audit', report: 'Report', monitoring: 'Monitoring', complete: 'Complete'
};

const COLORS = ['#52c41a', '#f5222d', '#faad14', '#1890ff']; // Improved, Declined, Stable, Others

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

  const renderKeywordChart = () => {
    if (!data?.keywords) return null;
    const chartData = [
      { name: 'Improved', value: data.keywords.improved },
      { name: 'Declined', value: data.keywords.declined },
      { name: 'Stable', value: data.keywords.stable }
    ];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <LayoutGrid size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Enterprise Command Center</Title>
          <Text type="secondary">Real-time overview of your workspace SEO performance, health, and AI agent activities.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !data || data.totalProjects === 0 ? (
        <Empty description="No SEO Workspace projects yet — create one from the Audit tab to get started." />
      ) : (
        <>
          {/* Hero Metrics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} md={6}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' }}>
                <Statistic title="Avg. SEO Score" value={data.avgSeoScore} suffix="/ 100" prefix={<ActivitySquare size={16} />} valueStyle={{ color: '#389e0d', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' }}>
                <Statistic title="Avg. Health Score" value={data.avgHealthScore} suffix="/ 100" prefix={<ActivitySquare size={16} />} valueStyle={{ color: '#096dd9', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)' }}>
                <Statistic title="Tracked Keywords" value={data.keywords?.total || 0} prefix={<BarChart2 size={16} />} valueStyle={{ color: '#531dab', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #ffd8e4 100%)' }}>
                <Statistic title="Active Projects" value={data.totalProjects} prefix={<Globe size={16} />} valueStyle={{ color: '#c41d7f', fontWeight: 600 }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card size="small" title="Keyword Performance Trends" style={{ height: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {renderKeywordChart()}
                </div>
                <Row gutter={16} style={{ textAlign: 'center' }}>
                  <Col span={8}><Statistic title="Improved" value={data.keywords?.improved || 0} valueStyle={{ color: COLORS[0], fontSize: 18 }} /></Col>
                  <Col span={8}><Statistic title="Declined" value={data.keywords?.declined || 0} valueStyle={{ color: COLORS[1], fontSize: 18 }} /></Col>
                  <Col span={8}><Statistic title="Stable" value={data.keywords?.stable || 0} valueStyle={{ color: COLORS[2], fontSize: 18 }} /></Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card size="small" title="Technical Crawl & Vitals" style={{ height: '100%' }}>
                <Statistic 
                  title="Total Pages Crawled" 
                  value={data.technical?.totalPagesCrawled || 0} 
                  prefix={<Globe size={16} />} 
                  style={{ marginBottom: 16 }}
                />
                <Statistic 
                  title="Crawl Errors (4xx/5xx)" 
                  value={data.technical?.totalErrors || 0} 
                  prefix={<ServerCrash size={16} />} 
                  valueStyle={data.technical?.totalErrors > 0 ? { color: '#f5222d' } : { color: '#52c41a' }}
                  style={{ marginBottom: 16 }}
                />
                <Statistic 
                  title="Sites with Good Web Vitals" 
                  value={data.technical?.sitesWithGoodVitals || 0} 
                  suffix={`/ ${data.totalProjects}`}
                  prefix={<CheckCircle size={16} />} 
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card size="small" title="Tasks & Approvals" style={{ height: '100%' }}>
                <Row gutter={[0, 16]}>
                  <Col span={24}>
                    <Statistic title="Pending Strategies" value={data.pendingStrategies} prefix={<TrendingUp size={16} />} valueStyle={{ color: '#1890ff' }} />
                  </Col>
                  <Col span={24}>
                    <Statistic title="Pending Tasks" value={data.pendingTasks} prefix={<ClipboardList size={16} />} valueStyle={{ color: '#faad14' }} />
                  </Col>
                  <Col span={24}>
                    <Statistic
                      title="Failed AI Tasks"
                      value={data.failedTasks}
                      prefix={<AlertTriangle size={16} />}
                      valueStyle={data.failedTasks > 0 ? { color: '#f5222d' } : { color: '#52c41a' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" title="Active Projects Overview" style={{ height: '100%' }}>
                <Table
                  rowKey="_id"
                  size="small"
                  pagination={false}
                  dataSource={Array.isArray(data.projects) ? data.projects : []}
                  locale={{ emptyText: <Empty description="No projects yet" /> }}
                  columns={[
                    { title: 'Project Name', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
                    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
                    { title: 'Workflow Phase', dataIndex: 'phase', key: 'phase', render: (p) => <Tag color="blue">{PHASE_LABELS[p] || p}</Tag> },
                    {
                      title: 'SEO Score', key: 'lastAuditScore',
                      render: (_, r) => r.stats?.lastAuditScore != null
                        ? <Progress percent={Math.round(r.stats.lastAuditScore)} size="small" strokeColor={{ '0%': '#ff4d4f', '100%': '#52c41a' }} />
                        : <Text type="secondary">—</Text>
                    }
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title={<span><Activity size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Recent Agent Activity</span>} style={{ height: '100%' }}>
                {(!data.recentActivity || data.recentActivity.length === 0) ? (
                  <Empty description="No recent activity logs" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    rowKey="_id"
                    size="small"
                    pagination={false}
                    showHeader={false}
                    dataSource={Array.isArray(data.recentActivity) ? data.recentActivity : []}
                    columns={[
                      {
                        key: 'entry',
                        render: (_, r) => (
                          <div>
                            <Text strong>{r.action?.replace(/_/g, ' ')}</Text>{' '}
                            <Text type="secondary">on {r.targetType}</Text>
                            <div><Text type="secondary" style={{ fontSize: 12 }}>
                              {r.userId?.name || 'Automated Agent'} · {new Date(r.createdAt).toLocaleString()}
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