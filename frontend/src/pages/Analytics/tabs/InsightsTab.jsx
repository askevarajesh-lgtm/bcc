import React, { useState } from 'react';
import { Card, Typography, Tabs, Table, Progress, Row, Col } from 'antd';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from 'lucide-react';

const { Title, Text } = Typography;

const TrendIndicator = ({ diff, percent }) => {
  if (diff > 0) {
    return <Text type="success"><ArrowUpRight size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>{percent}%  <Text type="secondary" style={{ fontSize: 12 }}>+{diff}</Text></Text>;
  } else if (diff < 0) {
    return <Text type="danger"><ArrowDownRight size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>{Math.abs(percent)}% <Text type="secondary" style={{ fontSize: 12 }}>{diff}</Text></Text>;
  }
  return <Text type="secondary"><Minus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>—</Text>;
};

const Sparkline = ({ data, dataKey, color }) => (
  <div style={{ height: 40, width: 120 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const TrendTable = ({ data, type }) => {
  const columns = [
    {
      title: type === 'page' ? 'Page' : 'Query',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (text) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong ellipsis style={{ maxWidth: 400 }}>{type === 'page' ? text.split('/').filter(Boolean).pop() || 'Home' : text}</Text>
          {type === 'page' && <Text type="secondary" style={{ fontSize: 12 }}>{text} <a href={text} target="_blank" rel="noreferrer" style={{ marginLeft: 4 }}><ExternalLink size={12} /></a></Text>}
        </div>
      )
    },
    {
      title: 'Trend',
      key: 'trend',
      align: 'right',
      render: (_, record) => <TrendIndicator diff={record.diff} percent={record.percent} />
    },
    {
      title: 'Clicks',
      dataIndex: 'clicks',
      key: 'clicks',
      align: 'right',
      render: (val) => <Text strong>{val.toLocaleString()}</Text>
    }
  ];

  return (
    <Table 
      dataSource={data} 
      columns={columns} 
      pagination={false} 
      rowKey="dimension"
      size="small"
      style={{ marginTop: 16 }}
    />
  );
};

const InsightsTab = ({ data }) => {
  const { metrics, gscInsights, searchTraffic } = data;
  const [contentTab, setContentTab] = useState('top');
  const [queryTab, setQueryTab] = useState('top');

  if (!gscInsights) return null;

  const totalCountryClicks = gscInsights.countries.reduce((sum, c) => sum + c.clicks, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Overview Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontWeight: 600 }}>Clicks</Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
                  <Title level={2} style={{ margin: 0 }}>{metrics.clicks.toLocaleString()}</Title>
                  <Text type={metrics.clicksTrend.startsWith('+') ? 'success' : 'danger'}>{metrics.clicksTrend}</Text>
                </div>
              </div>
              <Sparkline data={searchTraffic} dataKey="clicks" color="var(--accent-secondary)" />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontWeight: 600 }}>Impressions</Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
                  <Title level={2} style={{ margin: 0 }}>{metrics.impressions.toLocaleString()}</Title>
                  <Text type={metrics.impressionsTrend.startsWith('+') ? 'success' : 'danger'}>{metrics.impressionsTrend}</Text>
                </div>
              </div>
              <Sparkline data={searchTraffic} dataKey="impressions" color="var(--accent-tertiary)" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Your Content */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Title level={4} style={{ marginTop: 0 }}>Your content</Title>
        <Tabs 
          activeKey={contentTab} 
          onChange={setContentTab}
          items={[
            { key: 'top', label: 'Top', children: <TrendTable data={gscInsights.pages.top} type="page" /> },
            { key: 'trendingUp', label: 'Trending up', children: <TrendTable data={gscInsights.pages.trendingUp} type="page" /> },
            { key: 'trendingDown', label: 'Trending down', children: <TrendTable data={gscInsights.pages.trendingDown} type="page" /> },
          ]}
        />
      </Card>

      {/* Queries */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Title level={4} style={{ marginTop: 0 }}>Queries leading to your site</Title>
        <Tabs 
          activeKey={queryTab} 
          onChange={setQueryTab}
          items={[
            { key: 'top', label: 'Top', children: <TrendTable data={gscInsights.queries.top} type="query" /> },
            { key: 'trendingUp', label: 'Trending up', children: <TrendTable data={gscInsights.queries.trendingUp} type="query" /> },
            { key: 'trendingDown', label: 'Trending down', children: <TrendTable data={gscInsights.queries.trendingDown} type="query" /> },
          ]}
        />
      </Card>

      {/* Bottom Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>Top countries</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {gscInsights.countries.map(c => {
                const pct = totalCountryClicks > 0 ? (c.clicks / totalCountryClicks) * 100 : 0;
                return (
                  <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 100 }}><Text ellipsis>{c.country}</Text></div>
                    <div style={{ flex: 1 }}>
                      <Progress percent={pct} showInfo={false} strokeColor="var(--accent-secondary)" trailColor="var(--bg-tertiary)" size="small" />
                    </div>
                    <div style={{ width: 50, textAlign: 'right' }}><Text type="secondary">{Math.round(pct)}%</Text></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>Additional traffic sources</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {gscInsights.additionalSources.map(s => (
                <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text>{s.source}</Text>
                  <Text strong>{s.clicks.toLocaleString()}</Text>
                </div>
              ))}
              {gscInsights.additionalSources.length === 0 && <Text type="secondary">No additional sources recorded.</Text>}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InsightsTab;
