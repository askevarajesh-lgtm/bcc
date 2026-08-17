import React, { useState } from 'react';
import { Card, Table, Typography, Input, Select, Button, Space, Tag, Empty } from 'antd';
import { SearchOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { semrushApi } from '../../../api/semrushApi';

const { Title, Text } = Typography;
const { Option } = Select;

const KeywordMagicToolTab = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState('phrase');
  const [hasSearched, setHasSearched] = useState(false);
  const [configStatus, setConfigStatus] = useState('available'); // 'available', 'not_configured', 'failed', 'unavailable'

  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    setHasSearched(true);
    setConfigStatus('available');
    
    try {
      const res = await semrushApi.getKeywordMagicTool(keyword, 'us', matchType, true);
      if (res && res.status) {
        setConfigStatus(res.status);
        setData(res.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setConfigStatus('failed');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Keyword',
      dataIndex: 'Keyword',
      key: 'Keyword',
      render: (text, record) => <Text strong>{text || record.Ph}</Text>
    },
    {
      title: 'Intent',
      dataIndex: 'Intent',
      key: 'Intent',
      render: (text, record) => {
        const val = text || record.In || '';
        let intent = 'I';
        let color = 'blue';
        if (val.includes('0')) { intent = 'C'; color = 'orange'; }
        else if (val.includes('1')) { intent = 'I'; color = 'blue'; }
        else if (val.includes('2')) { intent = 'N'; color = 'purple'; }
        else if (val.includes('3')) { intent = 'T'; color = 'green'; }
        return <Tag color={color}>{intent}</Tag>;
      }
    },
    {
      title: 'Volume',
      dataIndex: 'Search Volume',
      key: 'Volume',
      render: (text, record) => <Text>{Number(text || record.Nq || 0).toLocaleString()}</Text>
    },
    {
      title: 'Trend',
      key: 'Trend',
      render: () => <Text type="secondary">N/A</Text> // Add small sparkline chart here if available
    },
    {
      title: 'KD %',
      dataIndex: 'Keyword Difficulty Index',
      key: 'KD',
      render: (text, record) => {
        const kd = Number(text || record.Kd || 0);
        let color = kd > 70 ? 'red' : kd > 40 ? 'orange' : 'green';
        return <Tag color={color}>{kd.toFixed(1)}%</Tag>;
      }
    },
    {
      title: 'CPC (USD)',
      dataIndex: 'CPC',
      key: 'CPC',
      render: (text, record) => <Text>${Number(text || record.Cp || 0).toFixed(2)}</Text>
    }
  ];

  const getEmptyDescription = () => {
    if (!hasSearched) return "Enter a seed keyword to get started";
    if (configStatus === 'not_configured') return "Keyword Magic — Semrush API not configured";
    if (configStatus === 'unavailable') return "Keyword Magic — Temporarily unavailable";
    if (configStatus === 'failed') return "Keyword Magic — Provider error";
    if (configStatus === 'rate_limited') return "Keyword Magic — Rate limited";
    return "No results found for this keyword.";
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Keyword Magic Tool</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 24, width: '100%' }} size="middle">
          <Input 
            placeholder="Enter keyword" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleSearch}
          />
          <Select value={matchType} onChange={setMatchType} style={{ width: 120 }}>
            <Option value="broad">Broad Match</Option>
            <Option value="phrase">Phrase Match</Option>
            <Option value="exact">Exact Match</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            Search
          </Button>
          <Button icon={<FilterOutlined />}>Filters</Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Space>

        {data && data.length > 0 ? (
          <Table 
            dataSource={data} 
            columns={columns} 
            loading={loading}
            rowKey={(record) => record.Keyword || record.Ph}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty description={getEmptyDescription()} />
        )}
      </Card>
    </div>
  );
};

export default KeywordMagicToolTab;
