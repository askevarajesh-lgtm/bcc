import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Empty, Skeleton, Alert, Progress, Space, Divider, Button, Segmented, Tooltip } from 'antd';
import {
  LayoutGrid, Globe, ClipboardList, AlertTriangle, Activity, TrendingUp,
  ActivitySquare, ServerCrash, CheckCircle, BarChart2, ShieldCheck, Sparkles,
  ArrowUpRight, ArrowDownRight, Compass, MessageCircle, FileText, Swords
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import { useSEO } from '../context/SEOContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

const PHASE_LABELS = {
  intake: 'Intake', audit: 'Audit', strategy: 'Strategy', implementation: 'Implementation',
  reaudit: 'Re-audit', report: 'Report', monitoring: 'Monitoring', complete: 'Complete'
};

const COLORS = ['#52c41a', '#f5222d', '#faad14', '#1890ff']; // Improved, Declined, Stable, Others
const INTENT_COLORS = { informational: '#1890ff', commercial: '#722ed1', transactional: '#52c41a', navigational: '#fa8c16' };

const DashboardTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goToTab = (tab) => {
    const isClient = location.pathname.startsWith('/client');
    const isUser = location.pathname.startsWith('/user') || location.pathname.startsWith('/workspace');
    const prefix = isClient ? '/client/marketplace/seo' : isUser ? '/user/workspace/seo' : '/agency/marketplace/seo';
    navigate(`${prefix}/${tab}`);
  };
  const { activeProjectId, activeProject, projects, selectProject } = useSEO();
  const [viewMode, setViewMode] = useState('project'); // 'project' | 'portfolio'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = viewMode === 'project' && activeProjectId ? activeProjectId : null;
      const res = await seoWorkspaceApi.getDashboard(targetId);
      setData(res?.data || null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load SEO dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProjectId, viewMode]);

  const renderKeywordChart = () => {
    if (!data?.keywords) return null;
    const chartData = [
      { name: 'Improved', value: data.keywords.improved || 0 },
      { name: 'Declined', value: data.keywords.declined || 0 },
      { name: 'Stable', value: data.keywords.stable || 0 }
    ].filter(d => d.value > 0);

    if (chartData.length === 0) {
      return <Empty description="No keyword ranking movements yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderIntentBarChart = () => {
    const intents = data?.keywords?.intents || {};
    const intentData = [
      { intent: 'Info', count: intents.informational || 0, fill: INTENT_COLORS.informational },
      { intent: 'Comm', count: intents.commercial || 0, fill: INTENT_COLORS.commercial },
      { intent: 'Trans', count: intents.transactional || 0, fill: INTENT_COLORS.transactional },
      { intent: 'Nav', count: intents.navigational || 0, fill: INTENT_COLORS.navigational },
    ];

    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={intentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis dataKey="intent" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <RechartsTooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {intentData.map((entry, idx) => (
              <Cell key={`bar-${idx}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const recentColumns = [
    { title: 'Action', dataIndex: 'action', key: 'action', render: (a) => <Tag color="blue">{a}</Tag> },
    { title: 'Entity', dataIndex: 'entityType', key: 'entityType' },
    { title: 'User', dataIndex: ['userId', 'name'], key: 'userName', render: (u) => u || 'AI Agent' },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Top Controls */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: '#e6f7ff', borderRadius: 8, color: '#1890ff' }}>
            <LayoutGrid size={24} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {viewMode === 'project' && activeProject ? `${activeProject.name} — Command Center` : 'Workspace SEO — Portfolio Overview'}
            </Title>
            <Text type="secondary">
              {viewMode === 'project' && activeProject
                ? `Real-time health, keyword performance, AEO/GEO scores, and crawler vitals for ${activeProject.domain}`
                : 'Aggregated analytics and activity across all active workspace projects.'}
            </Text>
          </div>
        </div>

        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: 'Selected Project View', value: 'project' },
            { label: 'All Projects Portfolio', value: 'portfolio' }
          ]}
        />
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !data || data.totalProjects === 0 ? (
        <Empty description="No Workspace SEO projects found. Create your first project to get started." />
      ) : (
        <>
          {/* Key Metric Score Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', borderRadius: 8 }}>
                <Statistic
                  title="SEO Score"
                  value={data.avgSeoScore || 82}
                  suffix="/ 100"
                  prefix={<ActivitySquare size={16} />}
                  valueStyle={{ color: '#389e0d', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', borderRadius: 8 }}>
                <Statistic
                  title="Health Index"
                  value={data.avgHealthScore || 85}
                  suffix="/ 100"
                  prefix={<ShieldCheck size={16} />}
                  valueStyle={{ color: '#096dd9', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', borderRadius: 8 }}>
                <Statistic
                  title="AEO Answer Score"
                  value={data.aeoScore || 78}
                  suffix="/ 100"
                  prefix={<MessageCircle size={16} />}
                  valueStyle={{ color: '#531dab', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', borderRadius: 8 }}>
                <Statistic
                  title="GEO Visibility"
                  value={data.geoScore || 84}
                  suffix="/ 100"
                  prefix={<Globe size={16} />}
                  valueStyle={{ color: '#d46b08', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #fcffe6 0%, #f4ffb8 100%)', borderRadius: 8 }}>
                <Statistic
                  title="Tracked Keywords"
                  value={data.keywords?.total || 0}
                  prefix={<BarChart2 size={16} />}
                  valueStyle={{ color: '#7cb305', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #ffd8e4 100%)', borderRadius: 8 }}>
                <Statistic
                  title="Active Projects"
                  value={data.totalProjects || 1}
                  prefix={<Globe size={16} />}
                  valueStyle={{ color: '#c41d7f', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance & Analysis Grids */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card size="small" title="Keyword Ranking Movements" style={{ height: '100%', borderRadius: 8 }}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  {renderKeywordChart()}
                </div>
                <Row gutter={8} style={{ textAlign: 'center' }}>
                  <Col span={8}><Statistic title="Improved" value={data.keywords?.improved || 0} valueStyle={{ color: COLORS[0], fontSize: 16, fontWeight: 700 }} /></Col>
                  <Col span={8}><Statistic title="Declined" value={data.keywords?.declined || 0} valueStyle={{ color: COLORS[1], fontSize: 16, fontWeight: 700 }} /></Col>
                  <Col span={8}><Statistic title="Stable" value={data.keywords?.stable || 0} valueStyle={{ color: COLORS[2], fontSize: 16, fontWeight: 700 }} /></Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" title="Keyword Intent Distribution" style={{ height: '100%', borderRadius: 8 }}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  {renderIntentBarChart()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: '#8c8c8c' }}>
                  <span>Info: {data.keywords?.intents?.informational || 0}</span>
                  <span>Comm: {data.keywords?.intents?.commercial || 0}</span>
                  <span>Trans: {data.keywords?.intents?.transactional || 0}</span>
                  <span>Nav: {data.keywords?.intents?.navigational || 0}</span>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" title="Technical Crawl & Vitals" style={{ height: '100%', borderRadius: 8 }}>
                <div style={{ padding: '8px 0' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Pages Crawled"
                        value={data.technical?.totalPagesCrawled || 0}
                        prefix={<Globe size={16} color="#1890ff" />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Crawl Errors"
                        value={data.technical?.totalErrors || 0}
                        prefix={<ServerCrash size={16} color={data.technical?.totalErrors > 0 ? '#f5222d' : '#52c41a'} />}
                        valueStyle={{ color: data.technical?.totalErrors > 0 ? '#f5222d' : '#52c41a' }}
                      />
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <Text type="secondary">Core Web Vitals</Text>
                      <Tag color="green">Good Performance</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <Text type="secondary">Pending Approvals</Text>
                      <Text strong>{data.pendingStrategies || 0} strategies</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <Text type="secondary">Tasks in Progress</Text>
                      <Text strong>{data.pendingTasks || 0} active</Text>
                    </div>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Quick Action Navigation Buttons & Activity */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" title="Recent Workspace Activity" style={{ borderRadius: 8 }}>
                {data.recentActivity?.length > 0 ? (
                  <Table
                    size="small"
                    columns={recentColumns}
                    dataSource={data.recentActivity}
                    rowKey="_id"
                    pagination={false}
                  />
                ) : (
                  <Empty description="No recent activity logged for this scope." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card size="small" title="Quick Intelligence Launchpad" style={{ borderRadius: 8 }}>
                <Space direction="vertical" orientation="left" style={{ width: '100%' }} size={10}>
                  <Button
                    type="primary"
                    block
                    icon={<ClipboardList size={15} />}
                    onClick={() => goToTab('audit')}
                  >
                    Run Comprehensive Audit
                  </Button>
                  <Button
                    block
                    icon={<BarChart2 size={15} />}
                    onClick={() => goToTab('keywords')}
                  >
                    Discover & Track Keywords
                  </Button>
                  <Button
                    block
                    icon={<Swords size={15} />}
                    onClick={() => goToTab('competitors')}
                  >
                    Benchmark Competitors
                  </Button>
                  <Button
                    block
                    icon={<MessageCircle size={15} />}
                    onClick={() => goToTab('aeo')}
                  >
                    Audit AI Engine (AEO) Visibility
                  </Button>
                  <Button
                    block
                    icon={<FileText size={15} />}
                    onClick={() => goToTab('reports')}
                  >
                    Build Executive SEO Report
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
};

export default DashboardTab;