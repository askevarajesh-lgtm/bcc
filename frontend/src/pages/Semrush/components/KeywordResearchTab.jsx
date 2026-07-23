import React, { useState } from 'react';
import { Input, Button, Table, Tag, Spin, Typography, Progress, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { BarChart2, DollarSign, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; // Reusing premium structural CSS

const { Title, Text } = Typography;

const KeywordResearchTab = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!keyword) return;
    
    setLoading(true);
    setData([]);
    setError(null);
    
    try {
      const result = await semrushApi.getKeywordResearch(keyword);
      if (result && result.length > 0) {
        setData(result.map((item, i) => ({ ...item, key: i })));
      } else {
        setError('No keyword data found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch keyword data');
    } finally {
      setLoading(false);
    }
  };

  const getIntentTag = (val) => {
    const intents = {
      '0': { label: 'Commercial', color: 'purple' },
      '1': { label: 'Informational', color: 'blue' },
      '2': { label: 'Navigational', color: 'cyan' },
      '3': { label: 'Transactional', color: 'green' }
    };
    
    const intent = intents[val] || { label: val || 'Unknown', color: 'default' };
    
    return (
      <Tag color={intent.color} style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500, margin: 0 }}>
        {intent.label}
      </Tag>
    );
  };

  const getDifficultyColor = (kd) => {
    if (kd >= 80) return '#ff4d4f'; 
    if (kd >= 60) return '#fa8c16'; 
    if (kd >= 40) return '#faad14'; 
    if (kd >= 20) return '#52c41a'; 
    return '#1890ff'; 
  };

  const getDifficultyLabel = (kd) => {
    if (kd >= 80) return 'Very Hard';
    if (kd >= 60) return 'Hard';
    if (kd >= 40) return 'Possible';
    if (kd >= 20) return 'Easy';
    return 'Very Easy';
  };

  const columns = [
    {
      title: 'Keyword',
      dataIndex: 'Ph',
      key: 'Ph',
      render: (text) => (
        <Text strong style={{ fontSize: '14px', color: '#141414' }}>{text}</Text>
      ),
      sorter: (a, b) => a.Ph?.localeCompare(b.Ph),
      width: '30%',
    },
    {
      title: 'Intent',
      dataIndex: 'In',
      key: 'In',
      render: (val) => getIntentTag(val),
      filters: [
        { text: 'Commercial', value: '0' },
        { text: 'Informational', value: '1' },
        { text: 'Navigational', value: '2' },
        { text: 'Transactional', value: '3' },
      ],
      onFilter: (value, record) => record.In === value,
      width: '15%',
    },
    {
      title: 'Volume',
      dataIndex: 'Nq',
      key: 'Nq',
      sorter: (a, b) => Number(a.Nq) - Number(b.Nq),
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={16} color="#8c8c8c" />
          <Text strong>{Number(val).toLocaleString()}</Text>
        </div>
      ),
      width: '15%',
    },
    {
      title: 'Keyword Difficulty (KD %)',
      dataIndex: 'Kd',
      key: 'Kd',
      sorter: (a, b) => Number(a.Kd) - Number(b.Kd),
      render: (val) => {
        const kd = Number(val || 0);
        const color = getDifficultyColor(kd);
        return (
          <div style={{ width: '100%', maxWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
               <Text strong style={{ color }}>{kd}%</Text>
               <Text type="secondary" style={{ fontSize: '12px' }}>{getDifficultyLabel(kd)}</Text>
            </div>
            <Progress 
              percent={kd} 
              showInfo={false} 
              strokeColor={color} 
              trailColor="#f0f0f0" 
              size="small" 
            />
          </div>
        );
      },
      width: '25%',
    },
    {
      title: 'CPC',
      dataIndex: 'Cp',
      key: 'Cp',
      sorter: (a, b) => Number(a.Cp) - Number(b.Cp),
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <DollarSign size={14} color="#52c41a" />
          <Text>{Number(val || 0).toFixed(2)}</Text>
        </div>
      ),
      width: '15%',
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
            placeholder="Enter seed keyword (e.g., crm software)" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
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
            Research
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <Alert message="Research Failed" description={error} type="error" showIcon />
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
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Gathering keyword variations...</div>
          </motion.div>
        ) : data.length > 0 ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Title level={3} style={{ margin: 0 }}>
                  Keyword Magic for <span style={{ color: '#eb2f96' }}>"{keyword}"</span>
                </Title>
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                 <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Total Volume</Text>
                    <Text strong style={{ fontSize: 16 }}>{data.reduce((acc, curr) => acc + Number(curr.Nq || 0), 0).toLocaleString()}</Text>
                 </div>
                 <div style={{ width: 1, background: '#f0f0f0' }}></div>
                 <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Avg. KD</Text>
                    <Text strong style={{ fontSize: 16, color: getDifficultyColor(data.reduce((acc, curr) => acc + Number(curr.Kd || 0), 0) / data.length) }}>
                      {Math.round(data.reduce((acc, curr) => acc + Number(curr.Kd || 0), 0) / data.length)}%
                    </Text>
                 </div>
              </div>
            </div>

            <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <Table 
                columns={columns} 
                dataSource={data} 
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: false,
                  style: { padding: '0 24px 24px 0' }
                }}
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
            <Target style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Keyword Magic Tool</Title>
            <Text type="secondary">Enter a seed keyword to uncover search volumes, difficulty, and intent.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default KeywordResearchTab;
