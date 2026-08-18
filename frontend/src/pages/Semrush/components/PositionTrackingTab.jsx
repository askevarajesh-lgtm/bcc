import React, { useState, useEffect } from 'react';
import { Button, Typography, Table, Tag, Progress, Tooltip, Input, Select, Modal, Spin, message, Row, Col, Card } from 'antd';
import { DownloadOutlined, AimOutlined, PlusOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { BarChart2, ArrowUp, ArrowDown, Minus, ExternalLink, Globe, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './DashboardTab.css'; // Reuse styles

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PositionTrackingTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  const domain = project?.domain;
  const projectId = project?._id;

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [localData, setLocalData] = useState(null);
  
  // Use pre-fetched data from dashboard or local data if refreshed
  const data = localData || projectData?.positionTracking?.data || null;
  const configStatus = localData 
    ? 'available' 
    : (projectData?.positionTracking?.status || 'campaign_required');

  const handleRefresh = async () => {
    if (!projectId) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getPositionTracking(projectId, true);
      if (res.data.success && res.data.data) {
        setLocalData(res.data.data);
        message.success('Rankings updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh rankings');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  // Wizard State
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    device: 'Desktop',
    location: 'us',
    keywordsText: ''
  });

  // We no longer fetch on mount, data is provided by context

  const handleStartTracking = async () => {
    const rawKeywords = config.keywordsText.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (rawKeywords.length === 0) {
      return message.error('Please enter at least one keyword');
    }
    if (rawKeywords.length > 100) {
      return message.warning('Maximum 100 keywords allowed per campaign. Truncating list.');
    }

    try {
      setSaving(true);
      const res = await semrushApi.configureTracking(projectId, {
        device: config.device,
        location: config.location,
        keywords: rawKeywords
      });
      
      if (res.data.success) {
        message.loading({ content: 'Fetching rankings from Semrush...', key: 'tracking', duration: 0 });
        setShowWizard(false);
        
        // Immediately fetch live rankings so the table appears right away
        try {
          const rankRes = await semrushApi.getPositionTracking(projectId, true);
          if (rankRes.data.success && rankRes.data.data) {
            setLocalData(rankRes.data.data);
            message.success({ content: 'Rankings loaded!', key: 'tracking', duration: 3 });
          } else {
            // Still dismiss the wizard even if rankings aren't ready yet
            setLocalData({ 
              config: { device: config.device, location: config.location }, 
              rankings: rawKeywords.map(kw => ({ keyword: kw, position: '> 100', searchVolume: null, difficulty: null, cpc: null, intent: '', url: '-' }))
            });
            message.info({ content: 'Campaign configured. Rankings will update within 24h on Semrush.', key: 'tracking', duration: 4 });
          }
        } catch (fetchErr) {
          message.warning({ content: 'Configured! Rankings will appear after next refresh.', key: 'tracking', duration: 3 });
        }
        if (fetchProjectData) fetchProjectData();
      }
    } catch (err) {
      message.error('Failed to configure tracking');
    } finally {
      setSaving(false);
    }
  };

  const renderWizard = () => (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3}>New Position Tracking Campaign</Title>
        <Text type="secondary">Set up daily tracking for your most important keywords.</Text>
      </div>
      
      {step === 1 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Title level={5} style={{ marginBottom: 16 }}>1. Targeting</Title>
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <Globe size={16} style={{ marginRight: 8, color: '#722ed1' }}/> 
            <strong>{domain}</strong> <span style={{ color: '#8c8c8c' }}>as Root domain</span>
          </div>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Text strong>Search engine</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" style={{ background: '#fff', color: '#1890ff', borderColor: '#1890ff', marginRight: 8 }}>Google</Button>
                <Button disabled>Bing</Button>
              </div>
            </Col>
            <Col span={12}>
              <Text strong>Device</Text>
              <div style={{ marginTop: 8 }}>
                <Button 
                  type={config.device === 'Desktop' ? 'primary' : 'default'}
                  onClick={() => setConfig({...config, device: 'Desktop'})}
                  icon={<Monitor size={14} />}
                  style={{ marginRight: 8 }}
                >
                  Desktop
                </Button>
                <Button 
                  type={config.device === 'Mobile' ? 'primary' : 'default'}
                  onClick={() => setConfig({...config, device: 'Mobile'})}
                  icon={<Smartphone size={14} />}
                >
                  Mobile
                </Button>
              </div>
            </Col>
          </Row>

          <div style={{ marginBottom: 24 }}>
            <Text strong>Location</Text>
            <div style={{ marginTop: 8 }}>
              <Select 
                value={config.location} 
                onChange={(val) => setConfig({...config, location: val})}
                style={{ width: '100%' }}
              >
                <Option value="us">United States</Option>
                <Option value="uk">United Kingdom</Option>
                <Option value="ca">Canada</Option>
                <Option value="au">Australia</Option>
                <Option value="in">India</Option>
              </Select>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setStep(2)}>Continue To Keywords &rarr;</Button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Title level={5} style={{ marginBottom: 16 }}>2. Keywords</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Enter keywords one per line or separated by commas. (Limit: 100)
          </Text>
          
          <TextArea 
            rows={10} 
            placeholder={`keyword 1\nkeyword 2\nkeyword 3`}
            value={config.keywordsText}
            onChange={(e) => setConfig({...config, keywordsText: e.target.value})}
            style={{ marginBottom: 24, borderRadius: 8 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="link" onClick={() => setStep(1)}>&larr; Back To Targeting</Button>
            <Button type="primary" onClick={handleStartTracking} loading={saving} size="large" style={{ background: '#52c41a', borderColor: '#52c41a' }}>
              Start Tracking
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );

  const columns = [
    { 
      title: 'Keyword', 
      dataIndex: 'keyword', 
      key: 'keyword', 
      render: val => <Text strong style={{ fontSize: 14 }}>{val}</Text>,
      sorter: (a, b) => a.keyword.localeCompare(b.keyword)
    },
    { 
      title: 'Intent', 
      dataIndex: 'intent', 
      key: 'intent', 
      render: val => {
        if (!val) return '-';
        const intentCode = String(val).split(',')[0];
        const intentMap = {
          '0': { label: 'C', color: '#faad14', bg: '#fffbe6', title: 'Commercial' },
          '1': { label: 'I', color: 'var(--accent-primary)', bg: '#e6f7ff', title: 'Informational' },
          '2': { label: 'N', color: '#722ed1', bg: '#f9f0ff', title: 'Navigational' },
          '3': { label: 'T', color: '#52c41a', bg: '#f6ffed', title: 'Transactional' }
        };
        const intent = intentMap[intentCode];
        if (!intent) return '-';
        return (
          <Tooltip title={intent.title}>
            <div style={{ background: intent.bg, color: intent.color, border: `1px solid ${intent.color}40`, fontSize: 11, fontWeight: '700', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'help' }}>
              {intent.label}
            </div>
          </Tooltip>
        );
      }
    },
    { 
      title: 'SF', 
      dataIndex: 'serpFeaturesCount', 
      key: 'sf', 
      align: 'center',
      render: val => <Text type="secondary" style={{ fontSize: 12 }}>{val || '-'}</Text>,
      sorter: (a, b) => (Number(a.serpFeaturesCount) || 0) - (Number(b.serpFeaturesCount) || 0)
    },
    { 
      title: 'KD %', 
      dataIndex: 'difficulty', 
      key: 'difficulty', 
      align: 'center',
      render: val => {
        const kd = Number(val);
        if (!val && val !== 0) return '-';
        const getColor = (v) => {
          if (v > 84) return { color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' }; 
          if (v > 69) return { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' }; 
          if (v > 49) return { color: '#d4b106', bg: '#fffbe6', border: '#ffe58f' }; 
          if (v > 29) return { color: '#7cb305', bg: '#fcffe6', border: '#eaff8f' }; 
          return { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' };
        };
        const style = getColor(kd);
        return (
          <Tooltip title={`${kd}% Keyword Difficulty`}>
             <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 26, borderRadius: 13, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 700, fontSize: 12, cursor: 'help' }}>
               {kd}
             </div>
          </Tooltip>
        );
      },
      sorter: (a, b) => Number(a.difficulty) - Number(b.difficulty)
    },
    { 
      title: 'Pos. Prev', 
      dataIndex: 'previousPosition', 
      key: 'previousPosition', 
      align: 'center',
      render: val => {
        const pos = Number(val);
        return <Text type="secondary">{pos > 100 || !pos ? '-' : pos}</Text>;
      },
      sorter: (a, b) => (Number(a.previousPosition) || 101) - (Number(b.previousPosition) || 101)
    },
    { 
      title: 'Pos. Cur', 
      dataIndex: 'position', 
      key: 'position', 
      align: 'center',
      render: val => {
        const pos = Number(val);
        if (pos > 100 || !pos) return <Text type="secondary">-</Text>;
        return <Tag color={pos <= 3 ? 'green' : pos <= 10 ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{pos}</Tag>;
      },
      sorter: (a, b) => (Number(a.position) || 101) - (Number(b.position) || 101)
    },
    {
      title: 'Diff',
      key: 'diff',
      align: 'center',
      render: (_, record) => {
        const pos = Number(record.position) || 101;
        const prevPos = Number(record.previousPosition) || pos;
        let diff = 0;
        if (prevPos > 0 && prevPos !== pos && prevPos < 101 && pos < 101) diff = prevPos - pos;

        if (diff > 0) return <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 }}><ArrowUp size={14} style={{ marginRight: 2 }} /> {diff}</span>;
        if (diff < 0) return <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 }}><ArrowDown size={14} style={{ marginRight: 2 }} /> {Math.abs(diff)}</span>;
        return <span style={{ color: '#bfbfbf' }}>-</span>;
      }
    },
    {
      title: 'Visibility',
      dataIndex: 'visibility',
      key: 'visibility',
      align: 'right',
      render: val => val ? <Text>{Number(val).toFixed(2)}%</Text> : <Text type="secondary">-</Text>,
      sorter: (a, b) => Number(a.visibility) - Number(b.visibility)
    },
    {
      title: 'Est. Traffic',
      dataIndex: 'traffic',
      key: 'traffic',
      align: 'right',
      render: val => val ? <Text>{Number(val).toLocaleString()}</Text> : <Text type="secondary">-</Text>,
      sorter: (a, b) => Number(a.traffic) - Number(b.traffic)
    },
    { 
      title: 'Volume', 
      dataIndex: 'searchVolume', 
      key: 'searchVolume', 
      align: 'right',
      render: val => <Text strong style={{ color: 'var(--text-secondary)' }}>{val != null ? Number(val).toLocaleString() : '-'}</Text>,
      sorter: (a, b) => Number(a.searchVolume) - Number(b.searchVolume)
    },
    { 
      title: 'CPC', 
      dataIndex: 'cpc', 
      key: 'cpc', 
      align: 'right',
      render: val => val ? <Text type="secondary">${Number(val).toFixed(2)}</Text> : <Text type="secondary">-</Text>,
      sorter: (a, b) => Number(a.cpc) - Number(b.cpc)
    },
    { 
      title: 'URL', 
      dataIndex: 'url', 
      key: 'url', 
      align: 'center',
      render: val => {
        if (!val || val === '-') return '-';
        return (
          <Tooltip title={val}>
            <a href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f7ff', transition: 'all 0.2s', margin: '0 auto' }} onMouseOver={e => e.currentTarget.style.background = '#bae0ff'} onMouseOut={e => e.currentTarget.style.background = '#e6f7ff'}>
              <ExternalLink size={14} />
            </a>
          </Tooltip>
        );
      }
    }
  ];

  if (configStatus === 'not_configured') {
    return (
      <Card style={{ margin: 24, padding: 40 }}>
        <Empty description="Position Tracking — Provider not configured" />
      </Card>
    );
  }

  // Only show wizard if explicitly requested OR if no tracking has been configured yet at all
  if (showWizard || (!localData && configStatus === 'campaign_required')) {
    return renderWizard();
  }

  // Show loading state while rankings are being fetched after campaign setup
  if (refreshing && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Fetching keyword rankings from Semrush...</Text>
      </div>
    );
  }

  const rankings = data?.rankings || [];
  const top3 = rankings.filter(r => Number(r.position) > 0 && Number(r.position) <= 3).length;
  const top10 = rankings.filter(r => Number(r.position) > 0 && Number(r.position) <= 10).length;
  const top100 = rankings.filter(r => Number(r.position) > 0 && Number(r.position) <= 100).length;

  return (
    <div className="semrush-dashboard-container">
      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>Position Tracking for <span style={{ color: '#722ed1' }}>{domain}</span></Title>
              <Text type="secondary">
                <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/> {data?.config?.location?.toUpperCase()} | 
                <Monitor size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px 0 8px' }}/> {data?.config?.device}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button 
                type="primary" 
                icon={<ReloadOutlined spin={refreshing} />} 
                onClick={handleRefresh} 
                loading={refreshing}
                style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Rankings'}
              </Button>
              <Button icon={<SettingOutlined />} onClick={() => {
                 // Open configure modal or just reset config
                 setConfig({ ...config, keywordsText: rankings.map(r => r.keyword).join('\n')});
                 setStep(2);
                 setShowWizard(true);
              }}>
                Settings
              </Button>
              <Button icon={<DownloadOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
                Export
              </Button>
            </div>
          </div>

          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #722ed1' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Visibility</Text>
                <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                  {data?.overview?.visibility ? Number(data.overview.visibility).toFixed(2) : '0.00'}%
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Est. Traffic</Text>
                <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                  {data?.overview?.traffic ? Number(data.overview.traffic).toLocaleString() : '0'}
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Avg. Position</Text>
                <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                  {data?.overview?.avgPosition ? Number(data.overview.avgPosition).toFixed(2) : '0.00'}
                </Title>
              </Card>
            </Col>
          </Row>

          {data?.trend && data.trend.length > 0 && (
            <div className="semrush-chart-card" style={{ padding: 24, marginBottom: 24, background: '#fff', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                 <div style={{ width: 12, height: 12, borderRadius: 2, background: '#722ed1', marginRight: 8 }} />
                 <Text strong>{domain}</Text>
              </div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#8c8c8c' }} 
                      axisLine={{ stroke: '#f0f0f0' }} 
                      tickLine={false} 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `${val}%`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Visibility']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visibility" 
                      stroke="#722ed1" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#722ed1', strokeWidth: 0 }} 
                      activeDot={{ r: 6, fill: '#722ed1', stroke: '#fff', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="semrush-chart-card" style={{ padding: '0', overflow: 'hidden' }}>
            <Table 
              dataSource={rankings}
              columns={columns}
              rowKey="keyword"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} keywords` }}
              size="middle"
              style={{ margin: 0 }}
              rowClassName="semrush-table-row"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PositionTrackingTab;
