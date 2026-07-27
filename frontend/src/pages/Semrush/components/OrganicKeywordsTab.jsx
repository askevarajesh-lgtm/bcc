import React from 'react';
import { Button, Typography, Table, Tag, Progress, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { BarChart2, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import './DashboardTab.css'; 

const { Title, Text } = Typography;

const OrganicKeywordsTab = () => {
  const { project, projectData } = useOutletContext();
  const domain = project?.domain;
  const data = projectData?.organicKeywords || [];

  const columns = [
    { 
      title: 'Keyword', 
      dataIndex: 'keyword', 
      key: 'keyword', 
      render: val => <Text strong style={{ fontSize: 14 }}>{val}</Text>,
      sorter: (a, b) => a.keyword.localeCompare(b.keyword)
    },
    {
      title: 'SERP',
      dataIndex: 'serpFeatures',
      key: 'serpFeatures',
      render: val => {
        if (!val) return null;
        const features = String(val).split(',').map(Number);
        const featureMap = {
          0: { label: 'Instant Answer', icon: '⚡', color: '#fadb14' },
          1: { label: 'Knowledge Panel', icon: '🧠', color: '#13c2c2' },
          2: { label: 'Carousel', icon: '🎠', color: '#722ed1' },
          3: { label: 'Local Pack', icon: '📍', color: '#eb2f96' },
          4: { label: 'Top Stories', icon: '📰', color: '#1890ff' },
          5: { label: 'Images', icon: '🖼️', color: '#52c41a' },
          6: { label: 'Sitelinks', icon: '🔗', color: '#fa8c16' },
          7: { label: 'Reviews', icon: '⭐', color: '#faad14' },
          9: { label: 'Video', icon: '🎥', color: '#f5222d' },
          10: { label: 'Featured Snippet', icon: '👑', color: '#a0d911' },
          13: { label: 'Shopping', icon: '🛍️', color: '#1890ff' }
        };
        const rendered = features.map(f => featureMap[f]).filter(Boolean).slice(0, 3);
        if (rendered.length === 0) return null;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {rendered.map((f, i) => (
              <Tooltip key={i} title={f.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: `${f.color}20`, border: `1px solid ${f.color}40`, fontSize: 11 }}>
                  {f.icon}
                </div>
              </Tooltip>
            ))}
            {features.length > 3 && (
              <Tooltip title={`${features.length - 3} more`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#f0f0f0', border: '1px solid #d9d9d9', fontSize: 10, color: '#595959' }}>
                  +{features.length - 3}
                </div>
              </Tooltip>
            )}
          </div>
        );
      }
    },
    { 
      title: 'Position', 
      dataIndex: 'position', 
      key: 'position', 
      render: (val, record) => {
        const pos = Number(val);
        const prevPos = Number(record.previousPosition);
        let diff = 0;
        if (prevPos > 0 && prevPos !== pos) diff = prevPos - pos;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={pos <= 3 ? 'green' : pos <= 10 ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
              {pos}
            </Tag>
            <div style={{ minWidth: 40 }}>
              {diff > 0 && <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500 }}><ArrowUp size={14} style={{ marginRight: 2 }} /> {diff}</span>}
              {diff < 0 && <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500 }}><ArrowDown size={14} style={{ marginRight: 2 }} /> {Math.abs(diff)}</span>}
              {diff === 0 && prevPos > 0 && <span style={{ color: '#bfbfbf', display: 'flex', alignItems: 'center', fontSize: 12 }}><Minus size={14} style={{ marginRight: 2 }} /></span>}
              {prevPos === 0 && <span style={{ color: '#52c41a', fontSize: 10, fontWeight: 600, background: '#f6ffed', padding: '2px 4px', borderRadius: 4 }}>NEW</span>}
            </div>
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
        if (val === undefined || val === null || val === '') return '-';
        const intents = String(val).split(',').map(Number);
        const intentMap = {
          0: { label: 'C', color: '#faad14', bg: '#fffbe6', title: 'Commercial' },
          1: { label: 'I', color: '#1890ff', bg: '#e6f7ff', title: 'Informational' },
          2: { label: 'N', color: '#722ed1', bg: '#f9f0ff', title: 'Navigational' },
          3: { label: 'T', color: '#52c41a', bg: '#f6ffed', title: 'Transactional' }
        };
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {intents.map((i, idx) => {
              const intent = intentMap[i];
              if (!intent) return null;
              return (
                <Tooltip key={idx} title={intent.title}>
                  <div style={{ background: intent.bg, color: intent.color, border: `1px solid ${intent.color}40`, fontSize: 11, fontWeight: '700', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'help' }}>
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
      render: val => <Text strong style={{ color: 'var(--text-secondary)' }}>{Number(val).toLocaleString()}</Text>,
      sorter: (a, b) => Number(a.searchVolume) - Number(b.searchVolume)
    },
    { 
      title: 'Traffic %', 
      dataIndex: 'trafficPercent', 
      key: 'trafficPercent', 
      align: 'right',
      render: val => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 60 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{Number(val).toFixed(2)}%</span>
          <Progress percent={Number(val)} showInfo={false} size="small" strokeColor="#1890ff" trailColor="#f0f0f0" style={{ margin: 0, width: '100%' }} />
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
        const getColor = (v) => {
          if (v > 84) return { color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' }; // Very hard
          if (v > 69) return { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' }; // Hard
          if (v > 49) return { color: '#d4b106', bg: '#fffbe6', border: '#ffe58f' }; // Possible
          if (v > 29) return { color: '#7cb305', bg: '#fcffe6', border: '#eaff8f' }; // Easy
          return { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' }; // Very easy
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
      title: 'CPC (USD)', 
      dataIndex: 'cpc', 
      key: 'cpc', 
      align: 'right',
      render: val => <Text type="secondary">${Number(val).toFixed(2)}</Text>,
      sorter: (a, b) => Number(a.cpc) - Number(b.cpc)
    },
    { 
      title: 'URL', 
      dataIndex: 'url', 
      key: 'url', 
      align: 'center',
      render: val => (
        <Tooltip title={val}>
          <a href={val} target="_blank" rel="noreferrer" style={{ color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f7ff', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bae0ff'} onMouseOut={e => e.currentTarget.style.background = '#e6f7ff'}>
            <ExternalLink size={14} />
          </a>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="semrush-dashboard-container">
      <AnimatePresence mode="wait">
        {data && data.length > 0 ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ margin: 0 }}>Organic Keywords for <span style={{ color: '#722ed1' }}>{domain}</span></Title>
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
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <BarChart2 style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>No Organic Keywords Data Available</Title>
            <Text type="secondary">Click the 'Refresh Data' button to fetch the latest insights from Semrush.</Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganicKeywordsTab;
