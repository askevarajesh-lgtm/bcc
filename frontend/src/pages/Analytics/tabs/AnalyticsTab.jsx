import React, { useMemo, useState } from 'react';
import { Typography, Row, Col, Alert } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, Brush } from 'recharts';
import { BarChart2, MonitorSmartphone } from 'lucide-react';

import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import DrillDownDrawer from '../components/DrillDownDrawer';
import { useLegendToggle } from '../hooks/useLegendToggle';

const { Text } = Typography;

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

const PRIMARY_KPIS = (m) => [
  { key: 'sessions', label: 'SESSIONS', value: m.sessions?.toLocaleString() || '0', trend: m.sessionsTrend, color: 'var(--accent-primary)', goodDirection: 'up', description: 'Total GA4 sessions across configured properties in this range.' },
  { key: 'users', label: 'USERS', value: m.users?.toLocaleString() || '0', trend: m.usersTrend, color: 'var(--accent-secondary)', goodDirection: 'up', description: 'Total unique users (GA4 totalUsers).' },
  { key: 'leads', label: 'LEADS', value: m.leads?.toLocaleString() || '0', trend: m.leadsTrend, color: 'var(--accent-info)', goodDirection: 'up', description: 'CRM leads created in this range.' },
  { key: 'revenue', label: 'REVENUE', value: m.revenueFormatted || '₹0L', trend: m.revenueTrend, color: 'var(--accent-warning)', goodDirection: 'up', description: 'Sum of invoice grand totals raised in this range.' },
  { key: 'conversionRate', label: 'CONVERSION RATE', value: m.conversionRate || '0%', trend: m.conversionRateTrend, color: 'var(--text-tertiary)', goodDirection: 'up', description: 'Leads ÷ Sessions.' }
];

const SEARCH_KPIS = (m) => [
  { key: 'organicSessions', label: 'ORGANIC SESSIONS', value: m.organicSessions?.toLocaleString() || '0', trend: m.organicTrafficShare, color: 'var(--accent-primary)', goodDirection: 'up', comparisonLabel: 'share of total sessions', description: 'Sessions attributed to organic search.' },
  { key: 'clicks', label: 'CLICKS (SEARCH)', value: m.clicks?.toLocaleString() || '0', trend: m.clicksTrend, color: 'var(--accent-info)', goodDirection: 'up', description: 'Search Console clicks.' },
  { key: 'impressions', label: 'IMPRESSIONS', value: m.impressions?.toLocaleString() || '0', trend: m.impressionsTrend, color: 'var(--accent-secondary)', goodDirection: 'up', description: 'Search Console impressions.' },
  { key: 'ctr', label: 'CTR', value: m.ctr || '0%', trend: m.ctrTrend, color: 'var(--accent-warning)', goodDirection: 'up', description: 'Clicks ÷ Impressions.' },
  { key: 'averagePosition', label: 'AVG. POSITION', value: m.averagePosition || '0', trend: m.averagePositionTrend, color: 'var(--text-tertiary)', goodDirection: 'up', description: 'Impression-weighted average ranking position (lower is better).' },
  { key: 'bounceRate', label: 'BOUNCE RATE', value: m.bounceRate || '0%', trend: m.bounceRateTrend, color: 'var(--accent-danger)', goodDirection: 'down', description: 'GA4 bounce rate (lower is better).' },
  { key: 'engagementRate', label: 'ENGAGEMENT RATE', value: m.engagementRate || '0%', trend: m.engagementRateTrend, color: 'var(--accent-primary)', goodDirection: 'up', description: 'GA4 engagement rate.' }
];

const AnalyticsTab = ({ data, searchTerm = '' }) => {
  const metrics = data.metrics || {};
  const connections = data.meta?.connections || {};
  const [drillDown, setDrillDown] = useState(null);

  const trafficLegend = useLegendToggle();

  const primaryKpis = useMemo(() => PRIMARY_KPIS(metrics), [metrics]);
  const searchKpis = useMemo(() => SEARCH_KPIS(metrics), [metrics]);

  const pieData = useMemo(
    () => (data.leadsByChannel || []).map(c => ({ name: c.channel, value: c.leads, fill: CHANNEL_COLORS[c.channel] || CHANNEL_COLORS.Other })),
    [data.leadsByChannel]
  );
  const deviceData = useMemo(() => (data.topDevices || []).map(d => ({ name: d.device, sessions: d.sessions })), [data.topDevices]);
  const websiteTraffic = data.websiteTraffic || [];
  const searchTraffic = data.searchTraffic || [];
  const topPages = data.topLandingPages || [];
  const topSearchQueries = data.topSearchQueries || [];
  const topSearchPages = data.topSearchPages || [];

  const noAnalyticsSource = (connections.ga4?.configuredClients || 0) === 0;
  const noSearchSource = (connections.gsc?.configuredClients || 0) === 0;

  // Filter out KPI cards that have 0 values
  const isZeroValue = (val) => val === '0' || val === '0%' || val === '0.0%' || val === '0.00%' || val === '₹0L' || val === '₹0.00L' || val === '—';
  const visiblePrimaryKpis = primaryKpis.filter(kpi => !isZeroValue(kpi.value));
  const visibleSearchKpis = searchKpis.filter(kpi => !isZeroValue(kpi.value));

  const topSearchPagesCols = useMemo(() => [
    { title: 'Page Path', dataIndex: 'page', key: 'page', render: text => <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</span> },
    { title: 'Clicks', dataIndex: 'clicks', key: 'clicks', sorter: (a, b) => a.clicks - b.clicks, defaultSortOrder: 'descend', render: text => <strong style={{ color: 'var(--text-primary)' }}>{Number(text).toLocaleString()}</strong> },
    { title: 'Impressions', dataIndex: 'impressions', key: 'impressions', sorter: (a, b) => a.impressions - b.impressions, render: text => <span style={{ color: 'var(--text-secondary)' }}>{Number(text).toLocaleString()}</span> },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', sorter: (a, b) => a.ctr - b.ctr, render: text => <Text style={{ color: 'var(--accent-info)', fontWeight: 600 }}>{text}%</Text> },
    { title: 'Avg. Position', dataIndex: 'position', key: 'position', sorter: (a, b) => a.position - b.position, render: text => <span style={{ color: 'var(--text-secondary)' }}>{text}</span> }
  ], []);

  const topPagesCols = useMemo(() => [
    { title: 'Landing Page', dataIndex: 'path', key: 'path', sorter: (a, b) => a.path.localeCompare(b.path), render: text => <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</span> },
    { title: 'Sessions', dataIndex: 'sessions', key: 'sessions', sorter: (a, b) => a.sessions - b.sessions, defaultSortOrder: 'descend', render: text => <strong style={{ color: 'var(--text-primary)' }}>{Number(text).toLocaleString()}</strong> },
    { title: 'Bounce Rate', dataIndex: 'bounceRate', key: 'bounceRate', sorter: (a, b) => parseFloat(a.bounceRate) - parseFloat(b.bounceRate), render: text => <Text style={{ color: parseFloat(text) > 40 ? 'var(--accent-danger)' : 'var(--accent-warning)', fontWeight: 600 }}>{text}</Text> },
    { title: 'Engagement Rate', dataIndex: 'engagementRate', key: 'engagementRate', sorter: (a, b) => parseFloat(a.engagementRate) - parseFloat(b.engagementRate), render: text => (
      <span style={{ borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', fontWeight: 700, padding: '2px 8px', fontSize: 12 }}>{text}</span>
    ) }
  ], []);

  const isCompletelyEmpty = visiblePrimaryKpis.length === 0 && 
                            visibleSearchKpis.length === 0 && 
                            websiteTraffic.length === 0 && 
                            searchTraffic.length === 0 && 
                            topSearchQueries.length === 0 && 
                            topSearchPages.length === 0 && 
                            pieData.length === 0 && 
                            deviceData.length === 0 && 
                            topPages.length === 0;

  if (isCompletelyEmpty && !noAnalyticsSource && !noSearchSource) {
    return (
      <div style={{ marginTop: 60 }}>
        <EmptyState 
          icon={BarChart2} 
          message="No performance data found." 
          description="We successfully connected to Google Analytics and Search Console, but there is no data for this date range. Try selecting a different date range." 
        />
      </div>
    );
  }

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

      {visiblePrimaryKpis.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: visibleSearchKpis.length > 0 ? 16 : 32 }}>
          {visiblePrimaryKpis.map(kpi => <Col key={kpi.key} style={{ flex: '1 1 200px', minWidth: 200 }}><KpiCard {...kpi} /></Col>)}
        </Row>
      )}

      {visibleSearchKpis.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {visibleSearchKpis.map(kpi => <Col key={kpi.key} style={{ flex: '1 1 200px', minWidth: 200 }}><KpiCard {...kpi} /></Col>)}
        </Row>
      )}

      {websiteTraffic.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <ChartCard
            title="Website Traffic"
            subtitle="Daily sessions split by source · click a legend entry to isolate it · drag the handles below to zoom"
            height={380}
            isEmpty={websiteTraffic.length === 0}
            emptyState={<EmptyState icon={BarChart2} message="No GA4 traffic data for this range yet." />}
            exportFilename="website-traffic"
            exportRows={websiteTraffic}
            exportHeaders={[{ key: 'day', label: 'Day' }, { key: 'organic', label: 'Organic' }, { key: 'paid', label: 'Paid' }, { key: 'direct', label: 'Direct' }, { key: 'referral', label: 'Referral' }]}
            extra={<Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{(metrics.sessions || 0).toLocaleString()} TOTAL SESSIONS</Text>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={websiteTraffic} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-info)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-info)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-warning)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-warning)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--text-tertiary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--text-tertiary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} onClick={trafficLegend.onLegendClick} formatter={trafficLegend.legendFormatter} />
                <Area type="monotone" dataKey="referral" stackId="1" stroke="var(--text-tertiary)" strokeWidth={2} fill="url(#colorReferral)" name="Referral" hide={trafficLegend.isHidden('referral')} />
                <Area type="monotone" dataKey="direct" stackId="1" stroke="var(--accent-warning)" strokeWidth={2} fill="url(#colorDirect)" name="Direct" hide={trafficLegend.isHidden('direct')} />
                <Area type="monotone" dataKey="paid" stackId="1" stroke="var(--accent-info)" strokeWidth={2} fill="url(#colorPaid)" name="Paid" hide={trafficLegend.isHidden('paid')} />
                <Area type="monotone" dataKey="organic" stackId="1" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#colorOrganic)" name="Organic" hide={trafficLegend.isHidden('organic')} />
                {websiteTraffic.length > 14 && <Brush dataKey="day" height={24} stroke="var(--accent-primary)" travellerWidth={8} />}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {searchTraffic.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <ChartCard
            title="Search Console Traffic"
            subtitle="Daily clicks and impressions · drag the handles below to zoom"
            height={300}
            isEmpty={searchTraffic.length === 0}
            emptyState={<EmptyState message="No Search Console traffic data for this range yet." />}
            exportFilename="search-traffic"
            exportRows={searchTraffic}
            exportHeaders={[{ key: 'day', label: 'Day' }, { key: 'clicks', label: 'Clicks' }, { key: 'impressions', label: 'Impressions' }]}
            extra={<Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{(metrics.clicks || 0).toLocaleString()} TOTAL CLICKS</Text>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={searchTraffic} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-info)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-info)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--text-tertiary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--text-tertiary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={10} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} />
                <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="var(--text-tertiary)" strokeWidth={2} fill="url(#colorImpressions)" name="Impressions" />
                <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="var(--accent-info)" strokeWidth={2} fill="url(#colorClicks)" name="Clicks" />
                {searchTraffic.length > 14 && <Brush dataKey="day" height={24} stroke="var(--accent-info)" travellerWidth={8} />}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {topSearchQueries.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <ChartCard
            title="Top Search Queries"
            subtitle="Top organic keywords driving traffic · ranked by clicks"
            height={300}
            isEmpty={topSearchQueries.length === 0}
            emptyState={<EmptyState message="No Search Console query data for this range yet." />}
            exportFilename="top-search-queries"
            exportRows={topSearchQueries}
            exportHeaders={[{ key: 'query', label: 'Query' }, { key: 'clicks', label: 'Clicks' }, { key: 'impressions', label: 'Impressions' }]}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSearchQueries.slice(0, 10)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
                <YAxis dataKey="query" type="category" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Bar
                  dataKey="clicks"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                  fill="var(--accent-primary)"
                  name="Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {(pieData.length > 0 || deviceData.length > 0) && (
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {pieData.length > 0 && (
            <Col xs={24} lg={10}>
              <ChartCard
                title="Leads by Channel"
                subtitle="CRM leads grouped by source · click a slice to drill in"
                height={260}
                isEmpty={pieData.length === 0}
                emptyState={<EmptyState message="No leads in this range yet." />}
                exportFilename="leads-by-channel"
                exportRows={pieData.map(d => ({ channel: d.name, leads: d.value }))}
                exportHeaders={[{ key: 'channel', label: 'Channel' }, { key: 'leads', label: 'Leads' }]}
              >
                <div style={{ position: 'relative', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="var(--bg-secondary)"
                        strokeWidth={2}
                        onClick={(entry) => {
                          const point = entry?.payload ?? entry;
                          setDrillDown({
                            title: point.name,
                            subtitle: 'Leads-by-channel drill-down',
                            fields: [{ label: 'Channel', value: point.name }, { label: 'Leads', value: point.value?.toLocaleString() }]
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>{metrics.leads?.toLocaleString() || '0'}</div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>TOTAL LEADS</Text>
                  </div>
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
              </ChartCard>
            </Col>
          )}

          {deviceData.length > 0 && (
            <Col xs={24} lg={pieData.length > 0 ? 14 : 24}>
              <ChartCard
                title="Sessions by Device"
                subtitle="GA4 device category breakdown · click a bar to drill in"
                height={260}
                isEmpty={deviceData.length === 0}
                emptyState={<EmptyState icon={MonitorSmartphone} message="No device data for this range yet." />}
                exportFilename="sessions-by-device"
                exportRows={deviceData}
                exportHeaders={[{ key: 'name', label: 'Device' }, { key: 'sessions', label: 'Sessions' }]}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} dy={10} />
                    <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                    <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                    <Bar
                      dataKey="sessions"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                      fill="var(--accent-info)"
                      style={{ cursor: 'pointer' }}
                      onClick={(entry) => {
                        const point = entry?.payload ?? entry;
                        setDrillDown({
                          title: point.name,
                          subtitle: 'Device drill-down',
                          fields: [{ label: 'Device', value: point.name }, { label: 'Sessions', value: point.sessions?.toLocaleString() }]
                        });
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          )}
        </Row>
      )}

      {topPages.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <DataTable
            title="Top Landing Pages"
            subtitle="Top pages ranked by sessions · selected date range"
            columns={topPagesCols}
            dataSource={topPages}
            rowKey="path"
            searchTerm={searchTerm}
            searchableFields={['path']}
            exportFilename="top-landing-pages"
            emptyMessage="No page-level GA4 data for this range yet."
            onRowClick={(record) => setDrillDown({
              title: record.path,
              subtitle: 'Landing page drill-down',
              fields: [
                { label: 'Path', value: record.path },
                { label: 'Sessions', value: record.sessions?.toLocaleString() },
                { label: 'Bounce Rate', value: record.bounceRate },
                { label: 'Engagement Rate', value: record.engagementRate }
              ]
            })}
          />
        </div>
      )}

      <DrillDownDrawer
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={drillDown?.title}
        subtitle={drillDown?.subtitle}
        fields={drillDown?.fields}
      />
    </>
  );
};

export default React.memo(AnalyticsTab);