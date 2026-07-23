import React, { useState } from 'react';
import { Input, Button, Spin, Typography, Alert, Table, Tag, Progress, Tooltip, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { Globe, BarChart2, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; 

const { Title, Text } = Typography;

const OrganicKeywordsTab = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchedDomain, setSearchedDomain] = useState('');

  const handleSearch = async () => {
    if (!domain) return;
    
    setLoading(true);
    setData([]);
    setError(null);
    setSearchedDomain(domain);

    try {
      // Re-using the drilldown API which gives us exactly what we need
      const result = await semrushApi.getDomainKeywordsDrilldown(domain, 100);
      if (result && result.length > 0) {
        setData(result.map((item, i) => ({ ...item, key: i })));
      } else {
        setError('No organic keywords found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch organic keywords.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      title: 'CPC', 
      dataIndex: 'cpc', 
      key: 'cpc', 
      align: 'right',
      render: val => `$${Number(val).toFixed(2)}`,
      sorter: (a, b) => Number(a.cpc) - Number(b.cpc)
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
  ];

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
            placeholder="Enter domain to view all organic keywords (e.g., askeva.io)" 
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
            Analyze Keywords
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
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Fetching comprehensive keyword list...</div>
          </motion.div>
        ) : data.length > 0 ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ margin: 0 }}>Organic Keywords for <span style={{ color: '#722ed1' }}>{searchedDomain}</span></Title>
                <Text type="secondary">Displaying the top keywords driving traffic to this domain.</Text>
              </div>
              <Button icon={<DownloadOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
                Export
              </Button>
            </div>

            <div className="semrush-chart-card" style={{ padding: '0', overflow: 'hidden' }}>
              <Table 
                dataSource={data}
                columns={columns}
                rowKey="key"
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} keywords` }}
                size="middle"
                style={{ margin: 0 }}
                rowClassName="semrush-table-row"
              />
            </div>
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <BarChart2 style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Organic Keywords</Title>
            <Text type="secondary">Enter a domain above to view its complete organic search visibility.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default OrganicKeywordsTab;
