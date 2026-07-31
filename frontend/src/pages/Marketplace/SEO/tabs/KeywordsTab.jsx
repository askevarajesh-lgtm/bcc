import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Card, Table, Select, Space, Button, Empty, Alert, Tag, message,
  Input, Row, Col, Popconfirm, Tabs, Statistic, Divider, Tooltip, Badge
} from 'antd';
import { Hash, Sparkles, Network, TrendingUp, Search, Download, Target, Filter, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const INTENT_COLORS = { informational: 'blue', navigational: 'purple', commercial: 'orange', transactional: 'green', unknown: 'default' };
const STATUS_COLORS = { Suggested: 'gold', Approved: 'green', Rejected: 'red' };
const KD_COLOR = (kd) => kd < 30 ? '#52c41a' : kd < 70 ? '#faad14' : '#f5222d';

const TrendSparkline = ({ data = [] }) => {
  if (!data || data.length === 0) return <Text type="secondary" style={{ fontSize: 12 }}>N/A</Text>;
  const chartData = data.map((v, i) => ({ val: v, idx: i }));
  return (
    <div style={{ width: 80, height: 30 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line type="monotone" dataKey="val" stroke="#1890ff" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const KeywordsTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('tracked');
  const [error, setError] = useState(null);

  // Tracked Keywords State
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Approved');
  const [intentFilter, setIntentFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Discovery State
  const [seedKeyword, setSeedKeyword] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [relatedInput, setRelatedInput] = useState('');
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState(null);

  // Clusters State
  const [clusters, setClusters] = useState([]);
  const [loadingClusters, setLoadingClusters] = useState(false);

  // Gap State
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [gapData, setGapData] = useState(null);
  const [loadingGap, setLoadingGap] = useState(false);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await seoWorkspaceApi.getKeywords({ projectId, status: statusFilter !== 'All' ? statusFilter : undefined });
      setKeywords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load keywords');
    } finally {
      setLoading(false);
    }
  };

  const loadClusters = async () => {
    if (!projectId) return;
    setLoadingClusters(true);
    try {
      const res = await seoWorkspaceApi.getKeywordClusters(projectId);
      setClusters(res.data || []);
    } catch (err) {
      message.error('Failed to load clusters');
    } finally {
      setLoadingClusters(false);
    }
  };

  useEffect(() => { 
    if (projectId) {
      if (activeTab === 'tracked') load();
      if (activeTab === 'clusters') loadClusters();
    }
  }, [projectId, statusFilter, activeTab]);

  const runResearch = async () => {
    setRunning(true);
    try {
      const res = await seoWorkspaceApi.runKeywordResearchAgent(projectId, seedKeyword || undefined);
      setRunResult(res.data);
      message.success('Keyword research completed');
      load();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Keyword research failed');
    } finally {
      setRunning(false);
    }
  };

  const act = async (fn, successMsg) => {
    try {
      const res = await fn();
      message.success(`${successMsg}${res.modifiedCount != null ? ` (${res.modifiedCount})` : ''}`);
      setSelectedRowKeys([]);
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const fetchRelated = async () => {
    if (!relatedInput.trim()) return;
    setRelatedLoading(true);
    try {
      const res = await seoWorkspaceApi.getRelatedKeywords(projectId, relatedInput.trim());
      setRelated(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to fetch related keywords');
    } finally {
      setRelatedLoading(false);
    }
  };

  const fetchGap = async () => {
    if (!competitorUrl.trim()) return message.warning('Enter a competitor URL');
    setLoadingGap(true);
    try {
      const res = await seoWorkspaceApi.getKeywordGap(projectId, competitorUrl.trim());
      setGapData(res.data);
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to analyze gap');
    } finally {
      setLoadingGap(false);
    }
  };

  const filteredKeywords = useMemo(() => {
    return keywords.filter(k => {
      const matchesSearch = k.keyword.toLowerCase().includes(searchText.toLowerCase());
      const matchesIntent = intentFilter === 'All' || k.metrics?.intent === intentFilter;
      return matchesSearch && matchesIntent;
    });
  }, [keywords, searchText, intentFilter]);

  const handleExport = () => {
    if (!filteredKeywords.length) return message.warning('No data to export');
    const csvHeader = 'Keyword,Status,Volume,CPC,KD,Intent,Current Rank,Best Rank,Cluster\n';
    const csvData = filteredKeywords.map(k => 
      `"${k.keyword}","${k.status}","${k.metrics?.searchVolume || 0}","${k.metrics?.cpc || 0}","${k.metrics?.keywordDifficulty || 0}","${k.metrics?.intent || 'unknown'}","${k.ranking?.currentRank || ''}","${k.ranking?.bestRank || ''}","${k.cluster || k.parentKeyword || ''}"`
    ).join('\n');
    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: (k, r) => (
      <Space direction="vertical" size={0}>
        <Text strong>{k}</Text>
        {r.cluster && <Text type="secondary" style={{fontSize: 11}}>Cluster: {r.cluster}</Text>}
      </Space>
    )},
    { title: 'Intent', dataIndex: ['metrics', 'intent'], key: 'intent', render: (i) => <Tag color={INTENT_COLORS[i] || 'default'}>{i || 'N/A'}</Tag> },
    { title: 'Volume', dataIndex: ['metrics', 'searchVolume'], key: 'volume', sorter: (a, b) => (a.metrics?.searchVolume || 0) - (b.metrics?.searchVolume || 0), render: v => v ? v.toLocaleString() : <Text type="secondary">N/A</Text> },
    { title: 'CPC', dataIndex: ['metrics', 'cpc'], key: 'cpc', render: v => v ? `$${v.toFixed(2)}` : <Text type="secondary">N/A</Text> },
    { title: 'KD %', dataIndex: ['metrics', 'keywordDifficulty'], key: 'kd', render: v => v ? <Text style={{ color: KD_COLOR(v), fontWeight: 500 }}>{v}</Text> : <Text type="secondary">N/A</Text> },
    { title: 'Trend (12m)', dataIndex: ['metrics', 'trends'], key: 'trends', render: (t) => <TrendSparkline data={t} /> },
    { title: 'SERP', dataIndex: ['metrics', 'serpFeatures'], key: 'serp', render: (f) => f && f.length ? <Tooltip title={f.join(', ')}><Badge count={f.length} style={{ backgroundColor: '#1890ff' }} /></Tooltip> : <Text type="secondary">N/A</Text> },
    {
      title: 'Rank',
      dataIndex: ['ranking', 'currentRank'],
      key: 'rank',
      width: 140,
      render: (r, rec) => {
        const status = rec.ranking?.status || 'UNKNOWN';

        if (status !== 'FOUND' || r === null || r === undefined) {
          const statusMap = {
            NOT_FOUND_TOP100: { color: 'default', text: 'Not Found (>100)' },
            TIMEOUT: { color: 'warning', text: 'Timeout' },
            RATE_LIMIT: { color: 'error', text: 'Rate Limit' },
            PROVIDER_ERROR: { color: 'error', text: 'Provider Error' },
            CRAWL_ERROR: { color: 'error', text: 'Crawl Error' },
            UNKNOWN: { color: 'default', text: 'Pending' }
          };
          const s = statusMap[status] || statusMap.UNKNOWN;
          return <Tooltip title={`Status: ${status}`}><Badge status={s.color} text={s.text} /></Tooltip>;
        }
        
        const prev = rec.ranking?.previousRank;
        const diff = prev ? prev - r : 0;
        return (
          <Space>
            <Text strong>{r}</Text>
            {diff > 0 && <Text type="success" style={{ fontSize: 12 }}>+{diff}</Text>}
            {diff < 0 && <Text type="danger" style={{ fontSize: 12 }}>{diff}</Text>}
          </Space>
        );
      }
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Hash size={28} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Keyword Intelligence</Title>
            <Text type="secondary">Enterprise keyword tracking, clustering, and competitive gaps.</Text>
          </div>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 24 }} />
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select a project to view keyword intelligence" />
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <TabPane tab={<Space><Target size={16}/> Tracked Keywords</Space>} key="tracked">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Input prefix={<Search size={14}/>} placeholder="Search keyword..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} />
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
                  <Option value="All">All Statuses</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Suggested">Suggested</Option>
                  <Option value="Rejected">Rejected</Option>
                </Select>
                <Select value={intentFilter} onChange={setIntentFilter} style={{ width: 140 }}>
                  <Option value="All">All Intents</Option>
                  <Option value="informational">Informational</Option>
                  <Option value="navigational">Navigational</Option>
                  <Option value="commercial">Commercial</Option>
                  <Option value="transactional">Transactional</Option>
                </Select>
              </Space>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <>
                    <Popconfirm title={`Approve ${selectedRowKeys.length} keywords?`} onConfirm={() => act(() => seoWorkspaceApi.approveKeywordSuggestions(projectId, selectedRowKeys), 'Approved')}>
                      <Button size="small" type="primary">Approve</Button>
                    </Popconfirm>
                    <Button size="small" danger onClick={() => act(() => seoWorkspaceApi.rejectKeywordSuggestions(projectId, selectedRowKeys), 'Rejected')}>Reject</Button>
                  </>
                )}
                <Button icon={<Sparkles size={14}/>} onClick={runResearch} loading={running} type="primary" ghost>Extract Keywords</Button>
                <Button icon={<RefreshCcw size={14}/>} onClick={load} loading={loading}>Refresh</Button>
                <Button icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
              </Space>
            </div>
            
            <Table
              rowKey="_id"
              size="small"
              loading={loading}
              dataSource={filteredKeywords}
              columns={columns}
              pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['20', '50', '100', '500'] }}
              rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
              footer={() => {
                const hiddenCount = keywords.length - filteredKeywords.length;
                return hiddenCount > 0 ? (
                  <Text type="secondary">
                    Showing {filteredKeywords.length} of {keywords.length} keywords. {hiddenCount} keywords are hidden due to active filters.
                  </Text>
                ) : (
                  <Text type="secondary">Showing all {keywords.length} keywords.</Text>
                );
              }}
              locale={{ emptyText: <Empty description="No keywords found. Switch to the Discovery tab to find opportunities." /> }}
            />
          </TabPane>

          <TabPane tab={<Space><Sparkles size={16}/> Discovery & Opportunities</Space>} key="discovery">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card size="small" title="AI Keyword Research Agent" bordered={false} style={{ background: '#f9f9f9', height: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>Generate new keyword clusters, related questions, and long-tail opportunities based on the project's domain and target audience.</Text>
                    <Input placeholder="Optional seed keyword (e.g. 'marathon training')" value={seedKeyword} onChange={(e) => setSeedKeyword(e.target.value)} />
                    <Button type="primary" loading={running} onClick={runResearch} icon={<Sparkles size={14}/>}>Run Deep Research</Button>
                    {runResult && (
                      <Alert type="success" showIcon message={`${runResult.suggestedKeywords?.length || 0} suggestion(s) from ${runResult.candidateCount || 0} candidate(s). Go to Tracked Keywords to approve them.`} />
                    )}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card size="small" title="Quick Related Keyword Lookup" bordered={false} style={{ background: '#f9f9f9', height: '100%' }}>
                  <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                    <Input placeholder="Search term (e.g. 'running shoes')" value={relatedInput} onChange={(e) => setRelatedInput(e.target.value)} onPressEnter={fetchRelated} />
                    <Button type="primary" loading={relatedLoading} onClick={fetchRelated} icon={<Search size={14}/>}>Lookup</Button>
                  </Space.Compact>
                  {related && (
                    <Table
                      rowKey="keyword"
                      size="small"
                      dataSource={related}
                      pagination={{ pageSize: 5 }}
                      locale={{ emptyText: <Empty description="No candidates found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                      columns={[
                        { title: 'Keyword', dataIndex: 'keyword', key: 'keyword' },
                        { title: 'Volume', dataIndex: 'searchVolume', key: 'searchVolume', render: v => v ? v.toLocaleString() : 'N/A' },
                        { title: 'Action', key: 'action', render: () => <Button size="small">Add to Project</Button> }
                      ]}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<Space><Network size={16}/> Clusters</Space>} key="clusters">
            {loadingClusters ? <Empty description="Loading clusters..." /> : clusters.length === 0 ? (
              <Empty description="No clusters generated yet. Ensure your tracked keywords have 'parentKeyword' or 'cluster' defined." />
            ) : (
              <Row gutter={[16, 16]}>
                {clusters.map(cluster => (
                  <Col xs={24} md={12} lg={8} key={cluster.parentKeyword}>
                    <Card size="small" title={<Space><Tag color="blue">{cluster.parentKeyword}</Tag></Space>} bordered>
                      <Statistic title="Total Search Volume" value={cluster.searchVolume.toLocaleString()} prefix={<TrendingUp size={14}/>} valueStyle={{ fontSize: 18 }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Text type="secondary" strong>{cluster.keywords.length} Keywords in Cluster</Text>
                      <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
                        {cluster.keywords.map(k => (
                          <div key={k._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text ellipsis style={{ maxWidth: 150 }}>{k.keyword}</Text>
                            <Text type="secondary">{k.metrics?.searchVolume ? k.metrics.searchVolume.toLocaleString() : 'N/A'}</Text>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>

          <TabPane tab={<Space><TrendingUp size={16}/> Keyword Gap</Space>} key="gap">
            <Card size="small" bordered={false} style={{ background: '#f9f9f9', marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Identify high-value keywords that your competitors rank for, but you are missing.</Text>
                <Space.Compact style={{ width: 400 }}>
                  <Input placeholder="Competitor Domain (e.g. competitor.com)" value={competitorUrl} onChange={e => setCompetitorUrl(e.target.value)} onPressEnter={fetchGap} />
                  <Button type="primary" onClick={fetchGap} loading={loadingGap}>Analyze Gap</Button>
                </Space.Compact>
              </Space>
            </Card>

            {gapData && (
              <Alert 
                type="info" 
                showIcon 
                message="API Integration Required" 
                description={gapData.message || "Competitor gap analysis requires an active external API connection (e.g., DataForSEO). No fake data was generated."}
              />
            )}
          </TabPane>
        </Tabs>
      )}
    </motion.div>
  );
};

export default KeywordsTab;