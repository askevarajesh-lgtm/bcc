import React from 'react';
import { Typography, Row, Col, Card, Table, Tag, Alert } from 'antd';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const CHANNEL_COLORS = {
  'Organic Search': 'var(--accent-primary)',
  'Paid Ads': 'var(--accent-info)',
  'Direct': 'var(--accent-warning)',
  'Referral': 'var(--text-tertiary)',
  'Social': 'var(--accent-secondary)',
  'Email': '#a78bfa',
  'WhatsApp': '#4ade80',
  'Other': '#94a3b8'
};

const topPagesCols = [
  { title: 'Landing Page', dataIndex: 'path', key: 'path', render: text => <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</span> },
  { title: 'Sessions', dataIndex: 'sessions', key: 'sessions', render: text => <strong style={{ color: 'var(--text-primary)' }}>{Number(text).toLocaleString()}</strong> },
  { title: 'Bounce Rate', dataIndex: 'bounceRate', key: 'bounceRate', render: text => <Text style={{ color: parseFloat(text) > 40 ? 'var(--accent-danger)' : 'var(--accent-warning)', fontWeight: 600 }}>{text}</Text> },
  { title: 'Engagement Rate', dataIndex: 'engagementRate', key: 'engagementRate', render: text => (
    <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', fontWeight: 700, padding: '2px 8px' }}>{text}</Tag>
  ) },
];

const KpiCard = ({ label, val, sub, color, down }) => (
  <Col style={{ flex: '1 1 200px', minWidth: 200 }}>
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
      <Card
        bodyStyle={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
        style={{ borderRadius: 0, height: '100%', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'var(--shadow-sm)' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

        <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textAlign: 'center', marginBottom: 16 }}>{label}</Text>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Title level={2} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 800, fontSize: 32 }}>{val}</Title>
          {sub && <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: down ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: down ? 'var(--accent-danger)' : 'var(--accent-primary)', fontWeight: 700, padding: '2px 8px' }}>{sub}</Tag>}
        </div>
      </Card>
    </motion.div>
  </Col>
);

const AnalyticsTab = ({ data }) => {
  if (!data) return null;
  const metrics = data.metrics || {};
  const connections = data.meta?.connections || {};

  const pieData = (data.leadsByChannel || []).map(c => ({ name: c.channel, value: c.leads, fill: CHANNEL_COLORS[c.channel] || CHANNEL_COLORS.Other }));
  const deviceData = (data.topDevices || []).map(d => ({ name: d.device, sessions: d.sessions }));
  const websiteTraffic = data.websiteTraffic || [];
  const topPages = data.topLandingPages || [];

  const noAnalyticsSource = (connections.ga4?.configuredClients || 0) === 0;
  const noSearchSource = (connections.gsc?.configuredClients || 0) === 0;

  return (
    <>
      {(noAnalyticsSource || noSearchSource) && (
        <Alert
          style={{ marginBottom: 24, borderRadius: 12 }}
          type="info"
          showIcon
          message="Some data sources aren't connected yet"
          description={
            <>
              {noAnalyticsSource && <div>No client has a Google Analytics 4 property configured — session, user and engagement metrics will read as 0 until one is connected.</div>}
              {noSearchSource && <div>No client has a Search Console property configured — clicks, impressions, CTR and position will read as 0 until one is connected.</div>}
            </>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'SESSIONS', val: metrics.sessions?.toLocaleString() || '0', sub: metrics.sessionsTrend, color: 'var(--accent-primary)', down: (metrics.sessionsTrend || '').startsWith('-') },
          { label: 'USERS', val: metrics.users?.toLocaleString() || '0', sub: metrics.usersTrend, color: 'var(--accent-secondary)', down: (metrics.usersTrend || '').startsWith('-') },
          { label: 'LEADS', val: metrics.leads?.toLocaleString() || '0', sub: metrics.leadsTrend, color: 'var(--accent-info)', down: (metrics.leadsTrend || '').startsWith('-') },
          { label: 'REVENUE', val: metrics.revenueFormatted || '₹0L', sub: metrics.revenueTrend, color: 'var(--accent-warning)', down: (metrics.revenueTrend || '').startsWith('-') },
          { label: 'CONVERSION RATE', val: metrics.conversionRate || '0%', sub: metrics.conversionRateTrend, color: 'var(--text-tertiary)', down: (metrics.conversionRateTrend || '').startsWith('-') },
        ].map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {[
          { label: 'ORGANIC SESSIONS', val: metrics.organicSessions?.toLocaleString() || '0', sub: metrics.organicTrafficShare, color: 'var(--accent-primary)' },
          { label: 'CLICKS (SEARCH)', val: metrics.clicks?.toLocaleString() || '0', sub: metrics.clicksTrend, color: 'var(--accent-info)', down: (metrics.clicksTrend || '').startsWith('-') },
          { label: 'IMPRESSIONS', val: metrics.impressions?.toLocaleString() || '0', sub: metrics.impressionsTrend, color: 'var(--accent-secondary)', down: (metrics.impressionsTrend || '').startsWith('-') },
          { label: 'CTR', val: metrics.ctr || '0%', sub: metrics.ctrTrend, color: 'var(--accent-warning)', down: (metrics.ctrTrend || '').startsWith('-') },
          { label: 'AVG. POSITION', val: metrics.averagePosition || '0', sub: metrics.averagePositionTrend, color: 'var(--text-tertiary)', down: (metrics.averagePositionTrend || '').startsWith('-') },
          { label: 'BOUNCE RATE', val: metrics.bounceRate || '0%', sub: metrics.bounceRateTrend, color: 'var(--accent-danger)', down: (metrics.bounceRateTrend || '').startsWith('-') },
          { label: 'ENGAGEMENT RATE', val: metrics.engagementRate || '0%', sub: metrics.engagementRateTrend, color: 'var(--accent-primary)', down: (metrics.engagementRateTrend || '').startsWith('-') },
        ].map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </Row>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Website Traffic</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Daily sessions split by source · selected date range</Text></div>}
          extra={<div style={{ textAlign: 'right' }}><Title level={3} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{(metrics.sessions || 0).toLocaleString()}</Title><Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>TOTAL SESSIONS</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
        >
          <div style={{ height: 350 }}>
            {websiteTraffic.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">No GA4 traffic data for this range yet.</Text></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={websiteTraffic} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="day" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} />
                  <Area type="monotone" dataKey="referral" stackId="1" stroke="var(--text-tertiary)" fill="var(--text-tertiary)" name="Referral" />
                  <Area type="monotone" dataKey="direct" stackId="1" stroke="var(--accent-warning)" fill="var(--accent-warning)" name="Direct" />
                  <Area type="monotone" dataKey="paid" stackId="1" stroke="var(--accent-info)" fill="var(--accent-info)" name="Paid" />
                  <Area type="monotone" dataKey="organic" stackId="1" stroke="var(--accent-primary)" fill="var(--accent-primary)" name="Organic" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={10}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Leads by Channel</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>CRM leads grouped by source</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
            >
              <div style={{ height: 260, position: 'relative' }}>
                {pieData.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">No leads in this range yet.</Text></div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="var(--bg-secondary)" strokeWidth={2}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <Title level={3} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.leads?.toLocaleString() || '0'}</Title>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>TOTAL LEADS</Text>
                    </div>
                  </>
                )}
              </div>

              <Row gutter={[16, 12]} style={{ marginTop: 16 }}>
                {pieData.map(d => (
                  <Col span={12} key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill }} />
                        <Text type="secondary" style={{ fontWeight: 600 }}>{d.name}</Text>
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} lg={14}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Sessions by Device</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>GA4 device category breakdown</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
            >
              <div style={{ height: 260 }}>
                {deviceData.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">No device data for this range yet.</Text></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} dy={10} />
                      <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                      <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      <Bar dataKey="sessions" radius={[6, 6, 0, 0]} maxBarSize={60} fill="var(--accent-info)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Top Landing Pages</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Top 10 pages ranked by sessions · selected date range</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: 40 }} bodyStyle={{ padding: 0 }}
        >
          <Table columns={topPagesCols} dataSource={topPages} pagination={false} rowKey="path" size="middle" scroll={{ x: 800 }} rowClassName={() => 'hover-bg'} locale={{ emptyText: 'No page-level GA4 data for this range yet.' }} />
        </Card>
      </motion.div>
    </>
  );
};

export default AnalyticsTab;