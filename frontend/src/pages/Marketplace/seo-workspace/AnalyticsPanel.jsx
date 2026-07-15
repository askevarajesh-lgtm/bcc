import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Spin, Row, Col } from 'antd';
import { BarChart2, MousePointer2, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import ScoreCard from './components/ScoreCard';
import useWorkspaceAnalytics from './hooks/useWorkspaceAnalytics';

const { Title } = Typography;
const { Option } = Select;

const AnalyticsPanel = ({ projects }) => {
  const { analyticsData, loading, fetchAnalytics } = useWorkspaceAnalytics();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (selectedProject) fetchAnalytics(selectedProject);
  }, [selectedProject, fetchAnalytics]);

  return (
    <Card className="seo-glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Project Analytics</Title>
        <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
          {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
        </Select>
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <BarChart2 size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Typography.Text type="secondary" style={{ display: 'block' }}>Select a project to view its SEO analytics</Typography.Text>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : analyticsData ? (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}><ScoreCard title="Total Clicks (GSC)" value={analyticsData.gsc?.clicks} icon={<MousePointer2 size={16} />} /></Col>
            <Col span={6}><ScoreCard title="Avg Position (GSC)" value={analyticsData.gsc?.position?.toFixed?.(1) ?? analyticsData.gsc?.position} icon={<TrendingUp size={16} />} /></Col>
            <Col span={6}><ScoreCard title="Sessions (GA4)" value={analyticsData.ga4?.sessions} icon={<Users size={16} />} /></Col>
            <Col span={6}><ScoreCard title="Conversions (GA4)" value={analyticsData.ga4?.conversions} icon={<CheckCircle size={16} />} /></Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card title="GSC Clicks & Impressions (30 Days)" size="small" className="seo-glass-panel">
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.gsc?.rows || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" hide />
                      <YAxis yAxisId="left" stroke="var(--text-secondary)" />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                      <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                      <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="var(--accent-primary)" strokeWidth={3} name="Clicks" dot={false} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="var(--accent-secondary)" strokeWidth={3} name="Impressions" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="GA4 Sessions & Users (30 Days)" size="small" className="seo-glass-panel">
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.ga4?.rows || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="var(--text-secondary)" />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                      <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                      <Line type="monotone" dataKey="sessions" stroke="var(--accent-warning)" strokeWidth={3} name="Sessions" dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="users" stroke="var(--accent-success)" strokeWidth={3} name="Users" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ) : null}
    </Card>
  );
};

export default AnalyticsPanel;
