import React, { useState, useEffect } from 'react';
import { Button, Typography, Table, Tag, Progress, Tooltip, Input, Select, Modal, Spin, message, Row, Col, Card } from 'antd';
import { DownloadOutlined, AimOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { BarChart2, ArrowUp, ArrowDown, Minus, ExternalLink, Globe, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; // Reuse styles

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PositionTrackingTab = () => {
  const { project } = useOutletContext();
  const domain = project?.domain;
  const projectId = project?._id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    device: 'Desktop',
    location: 'us',
    keywordsText: ''
  });
  const [configStatus, setConfigStatus] = useState('available');

  useEffect(() => {
    fetchTrackingData();
  }, [projectId]);

  const fetchTrackingData = async (force = false) => {
    try {
      setLoading(true);
      const res = await semrushApi.getPositionTracking(projectId, force);
      if (res.data.success) {
        setConfigStatus(res.data.status || 'available');
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to fetch tracking data');
      setConfigStatus('failed');
    } finally {
      setLoading(false);
    }
  };

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
        message.success('Tracking configured successfully!');
        await fetchTrackingData();
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
      title: 'Position', 
      dataIndex: 'position', 
      key: 'position', 
      render: (val, record) => {
        const pos = Number(val) || 101;
        const prevPos = Number(record.previousPosition) || pos;
        let diff = 0;
        if (prevPos > 0 && prevPos !== pos && prevPos < 101 && pos < 101) diff = prevPos - pos;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={pos <= 3 ? 'green' : pos <= 10 ? 'blue' : pos <= 100 ? 'default' : 'red'} style={{ margin: 0, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
              {pos > 100 ? '> 100' : pos}
            </Tag>
            <div style={{ minWidth: 40 }}>
              {diff > 0 && <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500 }}><ArrowUp size={14} style={{ marginRight: 2 }} /> {diff}</span>}
              {diff < 0 && <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500 }}><ArrowDown size={14} style={{ marginRight: 2 }} /> {Math.abs(diff)}</span>}
              {diff === 0 && pos <= 100 && <span style={{ color: '#bfbfbf', display: 'flex', alignItems: 'center', fontSize: 12 }}><Minus size={14} style={{ marginRight: 2 }} /></span>}
            </div>
          </div>
        );
      },
      sorter: (a, b) => (Number(a.position) || 101) - (Number(b.position) || 101)
    },
    { 
      title: 'Volume', 
      dataIndex: 'searchVolume', 
      key: 'searchVolume', 
      align: 'right',
      render: val => <Text strong style={{ color: 'var(--text-secondary)' }}>{Number(val).toLocaleString()}</Text>,
      sorter: (a, b) => Number(a.searchVolume) - Number(b.searchVolume)
    },
    { 
      title: 'KD %', 
      dataIndex: 'difficulty', 
      key: 'difficulty', 
      align: 'center',
      render: val => {
        const kd = Number(val);
        if (!kd) return '-';
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
      title: 'Traffic %', 
      dataIndex: 'trafficPercent', 
      key: 'trafficPercent', 
      align: 'right',
      render: val => {
        if (!val || val === '0') return '-';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 60 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{Number(val).toFixed(2)}%</span>
            <Progress percent={Number(val)} showInfo={false} size="small" strokeColor="var(--accent-primary)" trailColor="#f0f0f0" style={{ margin: 0, width: '100%' }} />
          </div>
        )
      },
      sorter: (a, b) => Number(a.trafficPercent) - Number(b.trafficPercent)
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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  }

  if (configStatus === 'not_configured') {
    return (
      <Card style={{ margin: 24, padding: 40 }}>
        <Empty description="Position Tracking — Provider not configured" />
      </Card>
    );
  }

  if (configStatus === 'campaign_required' || (data && !data.isConfigured)) {
    return renderWizard();
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
              <Button icon={<RefreshCw size={16} />} onClick={() => fetchTrackingData(true)} loading={loading} style={{ borderRadius: 8, fontWeight: 600 }}>
                Refresh
              </Button>
              <Button icon={<SettingOutlined />} onClick={() => {
                 // Open configure modal or just reset config
                 setConfig({ ...config, keywordsText: rankings.map(r => r.keyword).join('\n')});
                 setStep(2);
                 setData({ isConfigured: false });
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
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Text type="secondary">Top 3 Keywords</Text>
                <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{top3}</Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Text type="secondary">Top 10 Keywords</Text>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{top10}</Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Text type="secondary">Total Tracked in Top 100</Text>
                <Title level={2} style={{ margin: 0, color: '#722ed1' }}>{top100} / {rankings.length}</Title>
              </Card>
            </Col>
          </Row>

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
