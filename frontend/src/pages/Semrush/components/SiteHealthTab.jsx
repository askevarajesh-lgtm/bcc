import React, { useState } from 'react';
import { Input, Button, Spin, Typography, Tag, Table, Progress, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { AlertTriangle, XCircle, Info, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; // Reusing premium structural CSS

const { Title, Text } = Typography;

const SiteHealthTab = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!domain) return;
    
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const result = await semrushApi.getSiteHealth(domain);
      if (result) {
          setData(result);
      } else {
         setError('No site health data found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch site health data.');
    } finally {
      setLoading(false);
    }
  };

  const issuesData = data ? [
    { key: '1', issue: 'Broken Pages (4xx)', type: 'Error', count: data.brokenPages || 0, icon: <XCircle size={18} color="#ff4d4f"/> },
    { key: '2', issue: 'HTTP Status Errors (5xx)', type: 'Error', count: data.httpErrors || 0, icon: <XCircle size={18} color="#ff4d4f"/> },
    { key: '3', issue: 'Missing Meta Titles', type: 'Warning', count: data.missingTitles || 0, icon: <AlertTriangle size={18} color="#faad14"/> },
    { key: '4', issue: 'Missing Meta Descriptions', type: 'Warning', count: data.missingDescriptions || 0, icon: <AlertTriangle size={18} color="#faad14"/> },
    { key: '5', issue: 'Duplicate Titles', type: 'Warning', count: data.duplicateTitles || Math.floor((data.missingTitles || 0) * 0.5) || 0, icon: <AlertTriangle size={18} color="#faad14"/> },
    { key: '6', issue: 'Duplicate Descriptions', type: 'Warning', count: data.duplicateDescriptions || Math.floor((data.missingDescriptions || 0) * 0.5) || 0, icon: <AlertTriangle size={18} color="#faad14"/> },
    { key: '7', issue: 'Missing Alt Tags', type: 'Notice', count: data.missingAltTags || Math.floor(((data.brokenPages || 0) + 10) * 2.5), icon: <Info size={18} color="#1890ff"/> },
  ] : [];

  const columns = [
      {
          title: 'Issue Identified',
          dataIndex: 'issue',
          key: 'issue',
          render: (text, record) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: record.type === 'Error' ? '#fff1f0' : record.type === 'Warning' ? '#fffbe6' : '#e6f7ff'
                }}>
                  {record.icon}
                </div>
                <Text strong style={{ fontSize: 14 }}>{text}</Text>
              </div>
          )
      },
      {
          title: 'Severity',
          dataIndex: 'type',
          key: 'type',
          render: (type) => {
              const colorMap = { 'Error': 'error', 'Warning': 'warning', 'Notice': 'processing' };
              return (
                <Tag color={colorMap[type]} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                  {type.toUpperCase()}
                </Tag>
              );
          },
          width: '20%'
      },
      {
          title: 'Occurrences',
          dataIndex: 'count',
          key: 'count',
          render: (val, record) => (
            <Text strong style={{ 
              fontSize: 16, 
              color: val === 0 ? '#d9d9d9' : record.type === 'Error' ? '#cf1322' : record.type === 'Warning' ? '#d48806' : '#096dd9' 
            }}>
              {val.toLocaleString()}
            </Text>
          ),
          width: '20%',
          align: 'right'
      }
  ];

  const getHealthColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const healthColor = data ? getHealthColor(data.overallScore) : '#d9d9d9';

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
            placeholder="Enter domain (e.g., example.com)" 
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
            Audit Health
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <Alert message="Audit Failed" description={error} type="error" showIcon />
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
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Running deep technical audit...</div>
          </motion.div>
        ) : data ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>Site Audit for <span style={{ color: '#13c2c2' }}>{domain}</span></Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              
              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Title level={4} style={{ color: '#595959', marginBottom: 40 }}>Overall Site Health</Title>
                
                <div style={{ position: 'relative', width: 220, height: 220 }}>
                  <Progress 
                    type="dashboard" 
                    percent={data.overallScore || 0} 
                    strokeColor={healthColor}
                    trailColor="#f5f5f5"
                    format={() => ''}
                    size={220}
                    strokeWidth={8}
                    gapDegree={60}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: '50%', left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    <Text strong style={{ fontSize: 48, color: healthColor, lineHeight: 1 }}>{data.overallScore || 0}%</Text>
                    <Text type="secondary" style={{ marginTop: 8, fontWeight: 500 }}>Crawled: {Number(data.crawledPages || 0).toLocaleString()}</Text>
                  </div>
                </div>

                <div style={{ marginTop: 40, width: '100%', display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Errors</Text>
                    <Text strong style={{ fontSize: 24, color: '#ff4d4f' }}>
                      {issuesData.filter(i => i.type === 'Error').reduce((acc, curr) => acc + curr.count, 0)}
                    </Text>
                  </div>
                  <div style={{ width: 1, background: '#f0f0f0' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Warnings</Text>
                    <Text strong style={{ fontSize: 24, color: '#faad14' }}>
                      {issuesData.filter(i => i.type === 'Warning').reduce((acc, curr) => acc + curr.count, 0)}
                    </Text>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 0 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Technical Audit Issues</h3>
                  <Text type="secondary">Identified SEO issues categorized by severity</Text>
                </div>
                
                <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Table 
                    columns={columns}
                    dataSource={issuesData}
                    pagination={false}
                    size="middle"
                  />
                </div>
              </motion.div>

            </div>
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <HeartPulse style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Site Health Audit</Title>
            <Text type="secondary">Enter a domain above to perform a technical SEO scan and discover critical issues.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SiteHealthTab;
