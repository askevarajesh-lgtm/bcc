import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Progress, Tooltip, Row, Col, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';

const { Title, Text } = Typography;

const CompetitorAnalysisTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  
  const [localData, setLocalData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const competitors = localData || projectData?.overview?.competitors || projectData?.competitors || [];

  const handleRefresh = async () => {
    if (!project?._id) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getCompetitorAnalysis(project._id, true);
      if (res.data.success && res.data.data) {
        setLocalData(res.data.data.competitors || []);
        message.success('Competitors updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh Competitors');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const renderMetric = (val, isCurrency = false) => {
    if (val === null || val === undefined || val === '') return <Text type="secondary">Unavailable</Text>;
    const num = Number(val);
    if (isNaN(num)) return <Text type="secondary">Unavailable</Text>;
    if (isCurrency) return <Text>${num.toLocaleString()}</Text>;
    return <Text>{num.toLocaleString()}</Text>;
  };

  const columns = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (text) => (
        <Space>
          <img src={`https://www.google.com/s2/favicons?domain=${text}`} alt="" width={16} />
          <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Com. Level',
      dataIndex: 'competitorRelevance',
      key: 'relevance',
      render: (val) => {
        if (val === null || val === undefined) return <Text type="secondary">Unavailable</Text>;
        const percent = Math.min(100, Number(val) * 100).toFixed(1);
        return (
          <Tooltip title={`Relevance score: ${val}`}>
            <Progress percent={percent} size="small" status="active" />
          </Tooltip>
        );
      }
    },
    {
      title: 'Common Keywords',
      dataIndex: 'commonKeywords',
      key: 'commonKeywords',
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Keywords',
      dataIndex: 'organicKeywords',
      key: 'organicKeywords',
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Traffic',
      dataIndex: 'organicTraffic',
      key: 'organicTraffic',
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Traffic Cost',
      dataIndex: 'organicCost',
      key: 'organicCost',
      render: (val) => renderMetric(val, true)
    },
    {
      title: 'Ads Keywords',
      dataIndex: 'adwordsKeywords',
      key: 'adwordsKeywords',
      render: (val) => renderMetric(val)
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Organic Competitors</Title>
          <Text type="secondary">Domains competing for the same keywords in organic search.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={handleRefresh} 
            loading={refreshing}
            style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button icon={<DownloadOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
            Export
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Organic Competitors List">
            <Table
              columns={columns}
              dataSource={competitors}
              rowKey="domain"
              loading={refreshing}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CompetitorAnalysisTab;
