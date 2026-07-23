import React, { useState } from 'react';
import { Input, Button, Spin, Typography, Alert, Table, Tag, Drawer, Progress, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Trophy, TrendingUp, Globe, Link as LinkIcon, DollarSign, Activity, BarChart2, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; 

const { Title, Text } = Typography;

const DomainOverviewTab = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [backlinksData, setBacklinksData] = useState(null);
  const [error, setError] = useState(null);

  // Drill-down State
  const [keywordsDrawerVisible, setKeywordsDrawerVisible] = useState(false);
  const [keywordsDrawerLoading, setKeywordsDrawerLoading] = useState(false);
  const [keywordsDrilldownData, setKeywordsDrilldownData] = useState([]);

  const handleSearch = async () => {
    if (!domain) return;
    
    setLoading(true);
    setData(null);
    setBacklinksData(null);
    setError(null);

    try {
      const [overviewResult, backlinksResult] = await Promise.all([
        semrushApi.getDomainOverview(domain),
        semrushApi.getBacklinksOverview(domain)
      ]);
      
      let hasRealData = false;

      if (overviewResult && overviewResult.length > 0) {
          setData(overviewResult[0]);
          hasRealData = true;
      }

      if (backlinksResult && backlinksResult.length > 0) {
          setBacklinksData(backlinksResult[0]);
          hasRealData = true;
      }

      if (!hasRealData) {
          setError('No data found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch domain overview data.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  const openKeywordsDrilldown = async () => {
    if (!domain) return;
    setKeywordsDrawerVisible(true);
    if (keywordsDrilldownData.length > 0) return; // already fetched

    setKeywordsDrawerLoading(true);
    try {
      const result = await semrushApi.getDomainKeywordsDrilldown(domain, 100);
      setKeywordsDrilldownData(result.map((item, i) => ({ ...item, key: i })));
    } catch (err) {
      console.error('Failed to fetch keyword drilldown', err);
    } finally {
      setKeywordsDrawerLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon, color, delay, onClick }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`semrush-metric-card ${onClick ? 'clickable-card' : ''}`}
      style={{ '--card-accent': color, '--icon-bg': `${color}15`, minHeight: '140px', cursor: onClick ? 'pointer' : 'default', position: 'relative' }}
      onClick={onClick}
      whileHover={onClick ? { y: -5, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' } : {}}
    >
      <div className="metric-card-header">
        <h3 className="metric-card-title">{title}</h3>
        <div className="metric-icon-wrapper">
          {icon}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {onClick && (
        <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: 12, color: color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          View All <ExternalLink size={12} />
        </div>
      )}
    </motion.div>
  );

  const pieData = backlinksData ? [
    { name: 'Follow', value: Number(backlinksData.follows_num || 0), color: '#52c41a' },
    { name: 'Nofollow', value: Number(backlinksData.nofollows_num || 0), color: '#faad14' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="semrush-dashboard-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="semrush-search-glass"
      >
        <div style={{ display: 'flex', gap: '16px', maxWidth: 800, margin: '0 auto' }}>
          <Input 
            size="large"
            placeholder="Enter domain (e.g., apple.com)" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onPressEnter={handleSearch}
            style={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleSearch} 
            loading={loading}
            style={{ borderRadius: '8px', padding: '0 32px', fontWeight: 600, height: '46px' }}
          >
            Deep Dive
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <Alert message="Analysis Failed" description={error} type="error" showIcon />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Running deep domain analysis...</div>
          </motion.div>
        ) : (data || backlinksData) ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>Deep Analysis for <span style={{ color: '#722ed1' }}>{domain}</span></Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <MetricCard 
                title="Authority Score" 
                value={backlinksData?.score || data?.['Rank'] || '-'} 
                icon={<Trophy size={24} />} 
                color="#faad14"
                delay={0.1}
              />
              <MetricCard 
                title="Organic Traffic" 
                value={formatNumber(data?.['Organic Traffic'])} 
                icon={<TrendingUp size={24} />} 
                color="#52c41a"
                delay={0.2}
              />
              <MetricCard 
                title="Organic Keywords" 
                value={formatNumber(data?.['Organic Keywords'])} 
                icon={<Globe size={24} />} 
                color="#1890ff"
                delay={0.3}
                onClick={openKeywordsDrilldown}
              />
              <MetricCard 
                title="Total Backlinks" 
                value={formatNumber(backlinksData?.total)} 
                icon={<LinkIcon size={24} />} 
                color="#eb2f96"
                delay={0.4}
              />
              <MetricCard 
                title="Referring Domains" 
                value={formatNumber(backlinksData?.domains_num)} 
                icon={<Activity size={24} />} 
                color="#13c2c2"
                delay={0.5}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {pieData.length > 0 && (
                <motion.div 
                  className="semrush-chart-card" style={{ marginTop: 0 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="semrush-chart-header">
                    <h3 className="semrush-chart-title">Backlink Profile</h3>
                    <Text type="secondary">Follow vs Nofollow ratio</Text>
                  </div>
                  <div style={{ height: 260, display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val) => val.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ paddingRight: 40 }}>
                      {pieData.map(item => (
                        <div key={item.name} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }}></div>
                              <Text type="secondary">{item.name}</Text>
                          </div>
                          <Title level={4} style={{ margin: 0 }}>{formatNumber(item.value)}</Title>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {data?.['Organic Cost'] !== undefined && (
                <motion.div 
                  className="semrush-chart-card" style={{ marginTop: 0 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="semrush-chart-header">
                    <h3 className="semrush-chart-title">Traffic Value Insights</h3>
                    <Text type="secondary">Estimated cost of organic traffic in Google Ads</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <div style={{ width: '100%', padding: '20px', background: 'rgba(82, 196, 26, 0.05)', borderRadius: 12, border: '1px solid rgba(82, 196, 26, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{ background: '#52c41a', color: 'white', padding: 12, borderRadius: 12 }}>
                          <DollarSign size={32} />
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 16 }}>Organic Traffic Cost</Text>
                          <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                            ${formatNumber(data?.['Organic Cost'])}
                          </Title>
                        </div>
                      </div>
                      <Text type="secondary">
                        This domain would need to spend approximately <b>${formatNumber(data?.['Organic Cost'])}</b> per month in Google Ads to acquire the same number of visitors it currently gets organically.
                      </Text>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Top Organic Keywords */}
            {data?.topKeywords && data.topKeywords.length > 0 && (
              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 24 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Top Organic Keywords</h3>
                  <Text type="secondary">Highest traffic-driving keywords for this domain</Text>
                </div>
                <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Table 
                    dataSource={data.topKeywords}
                    rowKey="keyword"
                    columns={[
                      { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: val => <Text strong>{val}</Text> },
                      { title: 'Position', dataIndex: 'position', key: 'position', render: val => <Tag color={val <= 3 ? 'green' : val <= 10 ? 'blue' : 'default'}>{val}</Tag> },
                      { title: 'Volume', dataIndex: 'searchVolume', key: 'searchVolume', render: val => Number(val).toLocaleString(), align: 'right' },
                      { title: 'Traffic %', dataIndex: 'trafficPercent', key: 'trafficPercent', render: val => `${val}%`, align: 'right' },
                      { title: 'KD %', dataIndex: 'difficulty', key: 'difficulty', render: val => <Text strong style={{ color: val > 70 ? '#cf1322' : val > 40 ? '#d4b106' : '#389e0d' }}>{val}</Text>, align: 'right' },
                      { title: 'CPC', dataIndex: 'cpc', key: 'cpc', render: val => `$${Number(val).toFixed(2)}`, align: 'right' }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              </motion.div>
            )}

            {/* Main Organic Competitors */}
            {data?.competitors && data.competitors.length > 0 && (
              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 24 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Main Organic Competitors</h3>
                  <Text type="secondary">Domains competing for the same organic keywords</Text>
                </div>
                <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Table 
                    dataSource={data.competitors}
                    rowKey="domain"
                    columns={[
                      { title: 'Competitor Domain', dataIndex: 'domain', key: 'domain', render: val => <Text strong style={{ color: 'var(--accent-primary)' }}>{val}</Text> },
                      { title: 'Relevance', dataIndex: 'relevance', key: 'relevance', render: val => <Tag color="purple">{Number(val).toFixed(2)}</Tag> },
                      { title: 'Common Keywords', dataIndex: 'commonKeywords', key: 'commonKeywords', render: val => Number(val).toLocaleString(), align: 'right' },
                      { title: 'SE Keywords', dataIndex: 'organicKeywords', key: 'organicKeywords', render: val => Number(val).toLocaleString(), align: 'right' },
                      { title: 'SE Traffic', dataIndex: 'organicTraffic', key: 'organicTraffic', render: val => Number(val).toLocaleString(), align: 'right' }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              </motion.div>
            )}
            
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <Globe style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Deep Domain Analysis</Title>
            <Text type="secondary">Enter a domain above to view its comprehensive SEO overview and backlink profile.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Drill-down Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#e6f7ff', padding: 8, borderRadius: 8, display: 'flex' }}>
              <BarChart2 size={24} color="#1890ff" />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>Organic Keywords Drill-down</Title>
              <Text type="secondary">Complete search visibility data for {domain}</Text>
            </div>
          </div>
        }
        placement="right"
        width={1000}
        onClose={() => setKeywordsDrawerVisible(false)}
        open={keywordsDrawerVisible}
        bodyStyle={{ padding: 0, background: '#f5f5f5' }}
        headerStyle={{ borderBottom: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: '24px' }}>
          <div className="semrush-table-wrapper" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Table 
              dataSource={keywordsDrilldownData}
              rowKey="key"
              loading={keywordsDrawerLoading}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} keywords` }}
              columns={[
                { 
                  title: 'Keyword', 
                  dataIndex: 'keyword', 
                  key: 'keyword', 
                  render: val => <Text strong style={{ fontSize: 14 }}>{val}</Text>,
                  sorter: (a, b) => a.keyword.localeCompare(b.keyword)
                },
                { 
                  title: 'Position', 
                  dataIndex: 'position', 
                  key: 'position', 
                  render: (val, record) => {
                    const pos = Number(val);
                    const prevPos = Number(record.previousPosition);
                    let diff = 0;
                    if (prevPos > 0) diff = prevPos - pos;

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={pos <= 3 ? 'green' : pos <= 10 ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 600 }}>
                          {pos}
                        </Tag>
                        {diff > 0 && <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', fontSize: 12 }}><ArrowUp size={12} /> {diff}</span>}
                        {diff < 0 && <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', fontSize: 12 }}><ArrowDown size={12} /> {Math.abs(diff)}</span>}
                        {diff === 0 && prevPos > 0 && <span style={{ color: '#d9d9d9', display: 'flex', alignItems: 'center', fontSize: 12 }}><Minus size={12} /></span>}
                      </div>
                    );
                  },
                  sorter: (a, b) => Number(a.position) - Number(b.position)
                },
                { 
                  title: 'Intent', 
                  dataIndex: 'intent', 
                  key: 'intent', 
                  render: val => {
                    if (!val) return '-';
                    // Semrush returns integers for intents. 0=Commercial, 1=Informational, 2=Navigational, 3=Transactional
                    const intents = String(val).split(',').map(Number);
                    const intentMap = {
                      0: { label: 'C', color: 'orange', title: 'Commercial' },
                      1: { label: 'I', color: 'blue', title: 'Informational' },
                      2: { label: 'N', color: 'purple', title: 'Navigational' },
                      3: { label: 'T', color: 'green', title: 'Transactional' }
                    };
                    return (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {intents.map((i, idx) => {
                          const intent = intentMap[i];
                          if (!intent) return null;
                          return (
                            <Tooltip key={idx} title={intent.title}>
                              <div style={{ background: intent.color, color: 'white', fontSize: 10, fontWeight: 'bold', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                {intent.label}
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  }
                },
                { 
                  title: 'Volume', 
                  dataIndex: 'searchVolume', 
                  key: 'searchVolume', 
                  align: 'right',
                  render: val => Number(val).toLocaleString(),
                  sorter: (a, b) => Number(a.searchVolume) - Number(b.searchVolume)
                },
                { 
                  title: 'Traffic %', 
                  dataIndex: 'trafficPercent', 
                  key: 'trafficPercent', 
                  align: 'right',
                  render: val => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span>{Number(val).toFixed(2)}%</span>
                      <Progress percent={Number(val)} showInfo={false} size="small" strokeColor="#1890ff" style={{ margin: 0, width: 60 }} />
                    </div>
                  ),
                  sorter: (a, b) => Number(a.trafficPercent) - Number(b.trafficPercent)
                },
                { 
                  title: 'KD %', 
                  dataIndex: 'difficulty', 
                  key: 'difficulty', 
                  align: 'center',
                  render: val => {
                    const kd = Number(val);
                    return (
                      <Tooltip title={`${kd}% Keyword Difficulty`}>
                         <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 24, borderRadius: 12, background: kd > 70 ? '#fff1f0' : kd > 40 ? '#fffbe6' : '#f6ffed', color: kd > 70 ? '#cf1322' : kd > 40 ? '#d4b106' : '#389e0d', fontWeight: 600, fontSize: 12 }}>
                           {kd}
                         </div>
                      </Tooltip>
                    );
                  },
                  sorter: (a, b) => Number(a.difficulty) - Number(b.difficulty)
                },
                { 
                  title: 'URL', 
                  dataIndex: 'url', 
                  key: 'url', 
                  align: 'center',
                  render: val => (
                    <Tooltip title={val}>
                      <a href={val} target="_blank" rel="noreferrer" style={{ color: '#1890ff' }}>
                        <ExternalLink size={16} />
                      </a>
                    </Tooltip>
                  )
                }
              ]}
              size="middle"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DomainOverviewTab;
