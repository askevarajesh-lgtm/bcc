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

  const handleSearch = async () => {
    // Legacy Keyword Magic Tool used live API fetch. For the Intelligence background job,
    // this data is omitted to save credits. Show empty state or mock state.
    setHasSearched(true);
    setData([]);
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
            Search / Audit
          </Button>
          <Button icon={<FilterOutlined />}>Filters</Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Space>

        {data.length > 0 ? (
          <Table 
            columns={columns}
            dataSource={data}
            rowKey={(record, index) => `${record.Ph}-${index}`}
            loading={loading}
            pagination={{ pageSize: 50 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty description={hasSearched ? "Live Keyword Magic Tool is disabled. Please connect a live Semrush API account for this premium feature." : "Enter a seed keyword to get started"} />
        )}
      </Card>
    </div>
  );
};

export default KeywordMagicToolTab;
